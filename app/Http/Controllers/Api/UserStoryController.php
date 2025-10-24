<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserStoryRequest;
use App\Http\Requests\UpdateUserStoryRequest;
use App\Http\Resources\UserStoryResource;
use App\Models\Epic;
use App\Models\UserStory;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class UserStoryController extends Controller
{
    use AuthorizesRequests;

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserStoryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $epic = Epic::findOrFail($validated['epic_id']);
        
        $maxPosition = $epic->userStories()->max('position');

        $userStory = $epic->userStories()->create([
            'content' => $validated['content'],
            'status' => 'todo',
            'priority' => 'medium',
            'position' => ($maxPosition ?? 0) + 100,
            'is_ai_generated' => false, // Mark as user-created
            'origin_prompt_hash' => null,
        ]);

        return (new UserStoryResource($userStory))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserStoryRequest $request, UserStory $userStory): UserStoryResource
    {
        $updateData = $request->validated();
        
        // Mark as user-modified, protecting it from AI overwrites
        $updateData['is_ai_generated'] = false;
        $updateData['origin_prompt_hash'] = null;

        $userStory->update($updateData);

        return new UserStoryResource($userStory->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(UserStory $userStory): Response
    {
        $this->authorize('update', $userStory->epic->project);

        $userStory->delete();

        return response()->noContent();
    }
}