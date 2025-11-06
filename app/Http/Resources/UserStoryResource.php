<?php

namespace App\Http\Resources;

use App\Support\AdAssetParser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserStoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $parser = app(AdAssetParser::class);
        $angleFromEpic = null;

        if ($this->relationLoaded('epic') && $this->epic) {
            $angleFromEpic = $this->epic->title ?? null;
        }

        $derived = $parser->parse($this->content ?? '', $angleFromEpic);

        return [
            'id' => $this->id,
            'content' => $this->content,
            'status' => $this->status,
            'priority' => $this->priority,
            'position' => $this->position,
            'is_ai_generated' => $this->is_ai_generated,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'derived_fields' => $derived,
        ];
    }
}
