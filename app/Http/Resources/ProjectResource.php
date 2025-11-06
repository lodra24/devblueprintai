<?php

namespace App\Http\Resources;

use App\Support\AdAssetParser;
use Illuminate\Database\Eloquent\Model;
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
        $epicsLoaded = $this->resource instanceof Model && $this->resource->relationLoaded('epics');
        $epics = $epicsLoaded ? $this->resource->getRelation('epics') : collect();

        $metrics = null;
        if ($epicsLoaded) {
            $parser = app(AdAssetParser::class);
            $total = 0;
            $high = 0;
            $over = 0;

            foreach ($epics as $epic) {
                if (!$epic->relationLoaded('userStories')) {
                    continue;
                }

                foreach ($epic->userStories as $story) {
                    $total++;

                    if (($story->priority ?? null) === 'high') {
                        $high++;
                    }

                    $derived = $parser->parse($story->content ?? '', $epic->title ?? null);
                    $over += (int) ($derived['over_limit_count'] ?? 0);
                }
            }

            $metrics = [
                'assets_total' => $total,
                'high_priority_total' => $high,
                'over_limit_total' => $over,
            ];
        }

        $schemaSuggestions = [];
        $telemetry = null;
        $telemetryEnabled = (bool) config('blueprint.features.schema_telemetry', true);
        if ($this->resource instanceof Model) {
            if ($this->resource->relationLoaded('schemaSuggestions')) {
                $latest = $this->resource
                    ->getRelation('schemaSuggestions')
                    ->sortByDesc(fn ($record) => $record->created_at)
                    ->first();
            } else {
                $latest = $this->resource->schemaSuggestions()->latest()->first();
            }

            if ($latest !== null) {
                $parsed = $latest->parsed ?? [];
                $schemaSuggestions = $parsed['schemas'] ?? [];
                if ($telemetryEnabled && isset($parsed['telemetry'])) {
                    $warnings = $parsed['telemetry']['warnings'] ?? [];
                    $warnings = is_array($warnings) ? $warnings : [];

                    $telemetry = [
                        'parse_mode' => $parsed['telemetry']['parse_mode'] ?? null,
                        'schema_dropped' => $parsed['telemetry']['schema_dropped'] ?? null,
                        'warnings' => (object) $warnings,
                    ];
                }
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'idea_text' => $this->idea_text,
            'status' => $this->status,
            'progress' => $this->progress,
            'stage' => $this->stage ?? null,
            'message' => $this->message ?? null,
            'epics' => EpicResource::collection($epics),
            'schema_suggestions' => $schemaSuggestions,
            'telemetry' => $telemetry,
            'metrics' => $metrics,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
