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
            $storyToMove = UserStory::findOrFail($validated['storyId']);
            
            $beforeStory = isset($validated['beforeStoryId'])
                ? UserStory::find($validated['beforeStoryId'])
                : null;
            $afterStory = isset($validated['afterStoryId'])
                ? UserStory::find($validated['afterStoryId'])
                : null;

            $newPosition = $this->calculateNewPosition($beforeStory, $afterStory, $validated['targetEpicId']);
            
            // Mark the story as user-modified
            $storyToMove->is_ai_generated = false;
            $storyToMove->origin_prompt_hash = null;

            // If the epic is different, update it
            if ($storyToMove->epic_id !== $validated['targetEpicId']) {
                $storyToMove->epic_id = $validated['targetEpicId'];
            }
            
            $storyToMove->position = $newPosition;
            $storyToMove->save();
        });

        return response()->noContent();
    }

    /**
     * Calculate the new position for a story based on its neighbors.
     */
    private function calculateNewPosition(?UserStory $beforeStory, ?UserStory $afterStory, string $targetEpicId): int
    {
        // Case 1: Moved to the top of a list
        if (!$afterStory) {
            if ($beforeStory && $beforeStory->position <= self::POSITION_START) {
                $this->reindexEpicStories($targetEpicId);
                $beforeStory = $beforeStory->fresh();
            }

            $referencePosition = $beforeStory?->position ?? self::POSITION_START * 2;

            return max(1, intdiv($referencePosition, 2));
        }

        // Case 2: Moved to the bottom of a list
        if (!$beforeStory) {
            $maxPosition = UserStory::where('epic_id', $targetEpicId)->max('position');
            return ($maxPosition ?? 0) + self::POSITION_STEP;
        }

        // Case 3: Moved between two stories
        // If there's space, find the midpoint
        if ($beforeStory->position - $afterStory->position > 1) {
            return (int) floor(($beforeStory->position + $afterStory->position) / 2);
        }

        $this->reindexEpicStories($targetEpicId);

        $reindexedBefore = $beforeStory?->fresh();
        $reindexedAfter = $afterStory?->fresh();

        if ($reindexedBefore && $reindexedAfter) {
            return (int) floor(($reindexedBefore->position + $reindexedAfter->position) / 2);
        }

        // Fallbacks cover cases where one of the neighbors was missing
        if (!$reindexedAfter) {
            $minPosition = UserStory::where('epic_id', $targetEpicId)->min('position');
            $referencePosition = $minPosition ?? self::POSITION_START;

            return max(1, intdiv($referencePosition, 2));
        }

        $maxPosition = UserStory::where('epic_id', $targetEpicId)->max('position');
        return ($maxPosition ?? 0) + self::POSITION_STEP;
    }

    /**
     * Re-index all stories in an epic using deterministic spacing.
     */
    private function reindexEpicStories(string $epicId): void
    {
        $stories = UserStory::where('epic_id', $epicId)
            ->orderBy('position')
            ->lockForUpdate()
            ->get(['id', 'position']);

        if ($stories->isEmpty()) {
            return;
        }

        $position = self::POSITION_START;
        $updates = [];
        $timestamp = Carbon::now();

        foreach ($stories as $story) {
            if ((int) $story->position === $position) {
                $position += self::POSITION_STEP;
                continue;
            }

            $updates[] = [
                'id' => $story->id,
                'position' => $position,
                'updated_at' => $timestamp,
            ];

            $position += self::POSITION_STEP;
        }

        if (!empty($updates)) {
            UserStory::query()->upsert($updates, ['id'], ['position', 'updated_at']);
        }
    }
}
