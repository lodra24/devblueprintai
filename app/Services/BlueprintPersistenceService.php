<?php

namespace App\Services;

use App\Models\Epic;
use App\Actions\ValidateBlueprintDataAction;
use App\Models\Project;
use App\Parsing\BlueprintMarkdownParser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BlueprintPersistenceService
{
    public function __construct(
        protected ValidateBlueprintDataAction $validateBlueprintData,
        protected BlueprintMarkdownParser $parser
    ) {}

    /**
     * Parse raw markdown and persist it within a transaction.
     */
    public function persist(Project $project, string $rawMarkdown, string $promptHash): void
    {
        $parsedData = $this->parser->parse($rawMarkdown);
        $validatedData = ($this->validateBlueprintData)($parsedData);

        DB::transaction(function () use ($project, $validatedData, $rawMarkdown, $promptHash) {
            $existingEpics = $project->epics()
                ->where('is_ai_generated', true)
                ->with(['userStories' => function ($query) {
                    $query->where('is_ai_generated', true)
                        ->orderBy('position');
                }])
                ->get()
                ->keyBy(fn (Epic $epic) => $this->makeEpicKey($epic->title));

            $retainedEpicIds = [];
            $epicPosition = 100;
            foreach ($validatedData['epics'] as $epicData) {
                $epicKey = $this->makeEpicKey($epicData['title']);
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
                    ->keyBy(fn ($story) => $this->makeStoryKey($story->content));

                $retainedStoryIds = [];
                $storyPosition = 100;
                foreach ($epicData['stories'] as $storyData) {
                    $storyKey = $this->makeStoryKey($storyData['content']);
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

                // Delete AI generated stories not regenerated in this run
                $epic->userStories()
                    ->where('is_ai_generated', true)
                    ->whereNotIn('id', $retainedStoryIds)
                    ->delete();
            }

            // Delete AI generated epics not regenerated in this run
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

    private function makeEpicKey(string $title): string
    {
        return Str::slug($title) ?: sha1($title);
    }

    private function makeStoryKey(string $content): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim($content));

        return Str::slug($normalized) ?: sha1($normalized);
    }
}
