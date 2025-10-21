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
        $parsedData = $this->parser->parse($rawMarkdown);

        ['data' => $sanitisedData, 'warnings' => $warnings] = ($this->sanitiseBlueprintData)($parsedData);
        $validatedData = ($this->validateBlueprintData)($sanitisedData);

        $warningTotals = [
            'dedup_epics' => $warnings['dedup_epics'] ?? 0,
            'dedup_stories' => $warnings['dedup_stories'] ?? 0,
            'trimmed_epics' => $warnings['trimmed_epics'] ?? 0,
            'trimmed_stories' => $warnings['trimmed_stories'] ?? 0,
        ];

        if (array_sum($warningTotals) > 0) {
            Log::warning(
                'Blueprint sanitised (duplicates/overflows adjusted)',
                array_merge(['project_id' => $project->id], $warningTotals)
            );
        }

        DB::transaction(function () use ($project, $validatedData, $rawMarkdown, $promptHash) {
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
                        'status' => $storyData['status'] ?? ($story->status ?? 'todo'),
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

            if (!empty($validatedData['schema_suggestions'])) {
                $project->schemaSuggestions()->updateOrCreate(
                    [
                        'prompt_hash' => $promptHash,
                    ],
                    [
                        'prompt_hash' => $promptHash,
                        'raw_markdown' => $rawMarkdown,
                        'parsed' => ['schemas' => $validatedData['schema_suggestions']],
                    ]
                );
            } else {
                $project->schemaSuggestions()
                    ->where('prompt_hash', $promptHash)
                    ->delete();
            }
        });
    }
}
