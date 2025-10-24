<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEpicRequest;
use App\Http\Requests\UpdateEpicRequest;
use App\Http\Resources\EpicResource;
use App\Models\Epic;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests; 
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class EpicController extends Controller
{
    use AuthorizesRequests; 

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEpicRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $project = Project::findOrFail($validated['project_id']);

        // Calculate the position for the new epic
        $maxPosition = $project->epics()->max('position');

        $epic = $project->epics()->create([
            'title' => $validated['title'],
            'position' => ($maxPosition ?? 0) + 100,
            'is_ai_generated' => false, // Mark as user-created
            'origin_prompt_hash' => null,
        ]);
        
        // Load user stories, even though it will be empty for a new epic.
        // This ensures the resource returns a consistent structure.
        $epic->load('userStories');

        return (new EpicResource($epic))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEpicRequest $request, Epic $epic): EpicResource
    {
        $validated = $request->validated();
        
        $updateData = $validated;
        
        // Mark as user-modified, protecting it from AI overwrites
        $updateData['is_ai_generated'] = false;
        $updateData['origin_prompt_hash'] = null;

        $epic->update($updateData);

        return new EpicResource($epic->fresh()->load('userStories'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Epic $epic): Response
    {
        $this->authorize('update', $epic->project);

        $epic->delete();

        return response()->noContent();
    }
}