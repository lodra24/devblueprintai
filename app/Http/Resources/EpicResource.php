<?php

namespace App\Http\Resources;

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
        return [
            'id' => $this->id,
            'title' => $this->title,
            'position' => $this->position,
            'user_stories' => UserStoryResource::collection($this->whenLoaded('userStories')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}