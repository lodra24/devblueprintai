<?php

namespace App\Services;

use App\Actions\SanitiseBlueprintDataAction;
use App\Actions\ValidateBlueprintDataAction;
use App\Models\Epic;
use App\Models\Project;
use App\Parsing\BlueprintMarkdownParser;
use App\Support\BlueprintKeyFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BlueprintPersistenceService
{
    public function __construct(
        protected ValidateBlueprintDataAction $validateBlueprintData,
        protected BlueprintMarkdownParser $parser,
        protected SanitiseBlueprintDataAction $sanitiseBlueprintData
    ) {}

    /**
     * Parse raw markdown, normalise it, and persist within a transaction.
     */
    public function persist(Project $project, string $rawMarkdown, string $promptHash): void
    {
        $parseMode = 'markdown_fallback';
        $schemaDropped = false;

        $decoded = json_decode($rawMarkdown, true);
        if (is_array($decoded) && array_key_exists('epics', $decoded)) {
            $parseMode = 'json';
            $parsedData = [
                'epics' => $decoded['epics'] ?? [],
                'schema_suggestions' => $decoded['schema_suggestions'] ?? [],
            ];
        } else {
            $parsedData = $this->parser->parse($rawMarkdown);
        }

        ['data' => $sanitisedData, 'warnings' => $warnings] = ($this->sanitiseBlueprintData)($parsedData);
        [$validatedData, $schemaDropped] = $this->validateWithSchemaFallback($sanitisedData, $project);
        $telemetryEnabled = (bool) config('blueprint.features.schema_telemetry', true);

        $warningTotals = [
            'dedup_epics' => $warnings['dedup_epics'] ?? 0,
            'dedup_stories' => $warnings['dedup_stories'] ?? 0,
            'trimmed_epics' => $warnings['trimmed_epics'] ?? 0,
            'trimmed_stories' => $warnings['trimmed_stories'] ?? 0,
            'dedup_schemas' => $warnings['dedup_schemas'] ?? 0,
            'trimmed_schemas' => $warnings['trimmed_schemas'] ?? 0,
            'trimmed_schema_columns' => $warnings['trimmed_schema_columns'] ?? 0,
            'trimmed_titles' => $warnings['trimmed_titles'] ?? 0,
            'trimmed_story_chars' => $warnings['trimmed_story_chars'] ?? 0,
            'trimmed_column_tokens' => $warnings['trimmed_column_tokens'] ?? 0,
            'invalid_schema_tokens' => $warnings['invalid_schema_tokens'] ?? 0,
        ];

        if (array_sum($warningTotals) > 0) {
            Log::warning(
                'Blueprint sanitised (duplicates/overflows adjusted)',
                array_merge(
                    [
                        'project_id' => $project->id,
                        'prompt_hash' => $promptHash,
                        'parse_mode' => $parseMode,
                    ],
                    $warningTotals
                )
            );
        }

        Log::info('Blueprint data parsed', [
            'project_id' => $project->id,
            'parse_mode' => $parseMode,
            'schema_dropped' => $schemaDropped,
            'prompt_hash' => $promptHash,
        ]);

        DB::transaction(function () use ($project, $validatedData, $rawMarkdown, $promptHash, $parseMode, $schemaDropped, $warningTotals, $telemetryEnabled) {
            $existingEpics = $project->epics()
                ->where('is_ai_generated', true)
                ->with(['userStories' => function ($query) {
                    $query->where('is_ai_generated', true)
                        ->orderBy('position');
                }])
                ->get()
                ->keyBy(fn (Epic $epic) => BlueprintKeyFactory::epic($epic->title));

            $retainedEpicIds = [];
            $epicPosition = 100;
            foreach ($validatedData['epics'] as $epicData) {
                $epicKey = BlueprintKeyFactory::epic($epicData['title']);

                /** @var \App\Models\Epic $epic */
                $epic = $existingEpics[$epicKey] ?? $project->epics()->make();

                $epic->fill([
                    'title' => $epicData['title'],
                    'position' => $epicPosition,
                    'is_ai_generated' => true,
                    'origin_prompt_hash' => $promptHash,
                ]);
                $epic->save();

                $retainedEpicIds[] = $epic->id;
                $epicPosition += 100;

                $existingStories = $epic->userStories()
                    ->where('is_ai_generated', true)
                    ->get()
                    ->keyBy(fn ($story) => BlueprintKeyFactory::story($story->content));

                $retainedStoryIds = [];
                $storyPosition = 100;
                foreach ($epicData['stories'] as $storyData) {
                    $storyKey = BlueprintKeyFactory::story($storyData['content']);
                    $story = $existingStories[$storyKey] ?? $epic->userStories()->make();

                    $story->fill([
                        'content' => $storyData['content'],
                        'priority' => $storyData['priority'] ?? ($story->priority ?? 'medium'),
                        'position' => $storyPosition,
                        'is_ai_generated' => true,
                        'origin_prompt_hash' => $promptHash,
                    ]);
                    $story->save();

                    $retainedStoryIds[] = $story->id;
                    $storyPosition += 100;
                }

                $epic->userStories()
                    ->where('is_ai_generated', true)
                    ->whereNotIn('id', $retainedStoryIds)
                    ->delete();
            }

            $project->epics()
                ->where('is_ai_generated', true)
                ->whereNotIn('id', $retainedEpicIds)
                ->delete();

            if ($telemetryEnabled) {
                $project->schemaSuggestions()->updateOrCreate(
                    [
                        'prompt_hash' => $promptHash,
                    ],
                    [
                        'prompt_hash' => $promptHash,
                        'raw_markdown' => $rawMarkdown,
                        'parsed' => [
                            'schemas' => $validatedData['schema_suggestions'],
                            'telemetry' => [
                                'parse_mode' => $parseMode,
                                'schema_dropped' => $schemaDropped,
                                'warnings' => $warningTotals,
                            ],
                        ],
                    ]
                );
            } else {
                if (!empty($validatedData['schema_suggestions'])) {
                    $project->schemaSuggestions()->updateOrCreate(
                        [
                            'prompt_hash' => $promptHash,
                        ],
                        [
                            'prompt_hash' => $promptHash,
                            'raw_markdown' => $rawMarkdown,
                            'parsed' => [
                                'schemas' => $validatedData['schema_suggestions'],
                            ],
                        ]
                    );
                } else {
                    $project->schemaSuggestions()
                        ->where('prompt_hash', $promptHash)
                        ->delete();
                }
            }
        });
    }

    /**
     * Validate blueprint data and optionally drop invalid schema suggestions.
     *
     * @return array{array, bool} [validated data, schema dropped flag]
     */
    private function validateWithSchemaFallback(array $data, Project $project): array
    {
        try {
            $validated = ($this->validateBlueprintData)($data);
            return [$validated, false];
        } catch (ValidationException $exception) {
            if (empty($data['schema_suggestions'])) {
                throw $exception;
            }

            $errors = array_keys($exception->errors());
            $schemaErrors = array_filter($errors, fn (string $key) => Str::startsWith($key, 'schema_suggestions'));

            if (empty($schemaErrors)) {
                throw $exception;
            }

            $dataWithoutSchema = $data;
            $dataWithoutSchema['schema_suggestions'] = [];

            try {
                $validated = ($this->validateBlueprintData)($dataWithoutSchema);

                Log::warning('Schema suggestions dropped during validation', [
                    'project_id' => $project->id,
                    'error_keys' => array_values($schemaErrors),
                ]);

                return [$validated, true];
            } catch (ValidationException $_) {
                throw $exception;
            }
        }
    }
}
