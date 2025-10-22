<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
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
            'name' => $this->name,
            'idea_text' => $this->idea_text,
            'status' => $this->status,
            'progress' => $this->progress,
            'epics' => EpicResource::collection($this->whenLoaded('epics')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}