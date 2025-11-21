<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\AiGenerationException;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserStoryResource;
use App\Models\Epic;
use App\Services\EpicStoryGenerationService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class GenerateEpicStoryController extends Controller
{
    use AuthorizesRequests;

    public function __invoke(Epic $epic, EpicStoryGenerationService $service): JsonResponse|Response
    {
        $this->authorize('update', $epic->project);

        if (function_exists('set_time_limit')) {
            @set_time_limit(120);
        }

        $storyCount = $epic->userStories()->count();
        if ($storyCount >= 5) {
            return response()->json([
                'message' => 'A maximum of 5 stories can be generated for this angle.',
            ], 422);
        }

        try {
            $userStory = $service->generateAndPersist($epic);
        } catch (AiGenerationException $e) {
            Log::warning('AI generation failed for single epic story', [
                'epic_id' => $epic->id,
                'project_id' => $epic->project_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'AI generation failed: ' . $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Unexpected error while generating epic story', [
                'epic_id' => $epic->id,
                'project_id' => $epic->project_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again.',
            ], 500);
        }

        return (new UserStoryResource($userStory))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
