<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderUserStoryRequest;
use App\Models\UserStory;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class ReorderUserStoryController extends Controller
{
    private const POSITION_STEP = 100;
    private const POSITION_START = 100;

    /**
     * Handle the incoming request.
     */
    public function __invoke(ReorderUserStoryRequest $request): Response
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            $targetEpicId = (string) $validated['targetEpicId'];
            $beforeId = $validated['beforeStoryId'] ?? null;
            $afterId = $validated['afterStoryId'] ?? null;

            $story = UserStory::lockForUpdate()->findOrFail($validated['storyId']);
            $sourceEpicId = (string) $story->epic_id;

            $sourceStories = UserStory::where('epic_id', $sourceEpicId)
                ->orderBy('position')
                ->lockForUpdate()
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'epic_id' => (string) $s->epic_id,
                    'position' => (int) $s->position,
                    'content' => $s->content,
                    'priority' => $s->priority,
                    'created_at' => $s->created_at,
                ])
                ->values();

            $targetStories = ($sourceEpicId === $targetEpicId)
                ? $sourceStories->map(fn ($s) => $s)->values()
                : UserStory::where('epic_id', $targetEpicId)
                    ->orderBy('position')
                    ->lockForUpdate()
                    ->get()
                    ->map(fn ($s) => [
                        'id' => $s->id,
                        'epic_id' => (string) $s->epic_id,
                        'position' => (int) $s->position,
                        'content' => $s->content,
                        'priority' => $s->priority,
                        'created_at' => $s->created_at,
                    ])
                    ->values();

            $sourceStories = $sourceStories
                ->reject(fn ($s) => $s['id'] === $story->id)
                ->values();

            $targetStories = $targetStories
                ->reject(fn ($s) => $s['id'] === $story->id)
                ->values();

            $insertAt = 0;
            if ($afterId) {
                $pos = $targetStories->search(fn ($s) => $s['id'] === $afterId);
                $insertAt = ($pos === false) ? $targetStories->count() : $pos + 1;
            } elseif ($beforeId) {
                $pos = $targetStories->search(fn ($s) => $s['id'] === $beforeId);
                $insertAt = ($pos === false) ? $targetStories->count() : $pos;
            } else {
                $insertAt = 0;
            }

            $targetStories->splice($insertAt, 0, [[
                'id' => $story->id,
                'epic_id' => $targetEpicId,
                'position' => 0,
                'content' => $story->content,
                'priority' => $story->priority,
                'created_at' => $story->created_at,
            ]]);

            $story->epic_id = $targetEpicId;
            $story->is_ai_generated = false;
            $story->origin_prompt_hash = null;
            $story->save();

            $timestamp = Carbon::now();
            $updates = [];

            $position = self::POSITION_START;
            foreach ($targetStories as $targetStory) {
                $updates[] = [
                    'id' => $targetStory['id'],
                    'epic_id' => $targetEpicId,
                    'position' => $position,
                    'content' => $targetStory['content'],
                'priority' => $targetStory['priority'],
                'created_at' => $targetStory['created_at'],
                'updated_at' => $timestamp,
                ];
                $position += self::POSITION_STEP;
            }

            if ($sourceEpicId !== $targetEpicId) {
                $position = self::POSITION_START;
                foreach ($sourceStories as $sourceStory) {
                    $updates[] = [
                        'id' => $sourceStory['id'],
                        'epic_id' => $sourceEpicId,
                        'position' => $position,
                        'content' => $sourceStory['content'],
                        'priority' => $sourceStory['priority'],
                        'created_at' => $sourceStory['created_at'],
                        'updated_at' => $timestamp,
                    ];
                    $position += self::POSITION_STEP;
                }
            }

            if (!empty($updates)) {
                UserStory::query()->upsert(
                    $updates,
                    ['id'],
                    ['epic_id', 'position', 'content', 'priority', 'updated_at']
                );
            }
        });

        return response()->noContent();
    }
}
