<?php

namespace App\Http\Resources;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EpicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $userStories = collect();
        if ($this->resource instanceof Model && $this->resource->relationLoaded('userStories')) {
            $userStories = $this->resource->getRelation('userStories');
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'position' => $this->position,
            'is_ai_generated' => $this->is_ai_generated,
            'user_stories' => UserStoryResource::collection($userStories),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
