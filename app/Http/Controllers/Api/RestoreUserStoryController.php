<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserStoryResource;
use App\Models\UserStory;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class RestoreUserStoryController extends Controller
{
    use AuthorizesRequests;

    public function __invoke(UserStory $userStory): JsonResponse|UserStoryResource
    {
        $this->authorize('update', $userStory->epic->project);

        if (blank($userStory->original_content)) {
            return response()->json([
                'message' => 'No original content available to restore.',
            ], 409);
        }

        $userStory->update([
            'content' => $userStory->original_content,
            'is_ai_generated' => true,
        ]);

        return new UserStoryResource($userStory->fresh());
    }
}
