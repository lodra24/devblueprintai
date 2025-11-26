<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserStoryRequest;
use App\Http\Requests\UpdateUserStoryRequest;
use App\Http\Resources\UserStoryResource;
use App\Models\Epic;
use App\Models\UserStory;
use App\Support\AdAssetFormatter;
use App\Support\AdAssetParser;
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
            'original_content' => $validated['content'],
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
        $userStory->loadMissing('epic');
        $parser = app(AdAssetParser::class);
        $formatter = app(AdAssetFormatter::class);
        $existing = $parser->parse($userStory->content ?? '', $userStory->epic->title ?? null);

        $meta = $existing['meta'] ?? [];
        unset($meta['_unparsed_segments']);
        $assets = $existing['assets'] ?? [];
        $reasoning = $existing['reasoning'] ?? [];
        $limits = $updateData['limits'] ?? [];

        $meta = array_merge($meta, $updateData['meta'] ?? []);
        $assets = array_merge($assets, $updateData['assets'] ?? []);
        $reasoning = array_merge($reasoning, $updateData['reasoning'] ?? []);
        $content = $updateData['content'] ?? null;

        if ($content === null) {
            $content = $formatter->format([
                'meta' => $meta,
                'assets' => $assets,
                'reasoning' => $reasoning,
                'limits' => $limits,
            ]);
        }

        // Mark as user-modified, protecting it from AI overwrites
        $payload = [
            'content' => $content,
            'priority' => $updateData['priority'] ?? $userStory->priority,
            'is_ai_generated' => false,
            'origin_prompt_hash' => null,
        ];

        $userStory->update($payload);

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
