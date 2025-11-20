<?php

namespace App\Actions\Blueprint;

use App\Models\Project;

class SyncSchemaSuggestionsAction
{
    /**
     * Persist or clear schema suggestions.
     *
     * @param array<int, mixed> $schemaSuggestions
     * @param array<string, int> $warningTotals
     */
    public function __invoke(
        Project $project,
        array $schemaSuggestions,
        string $promptHash,
        bool $telemetryEnabled,
        string $rawMarkdown,
        string $parseMode,
        bool $schemaDropped,
        array $warningTotals
    ): void {
        if ($telemetryEnabled) {
            $project->schemaSuggestions()->updateOrCreate(
                [
                    'prompt_hash' => $promptHash,
                ],
                [
                    'prompt_hash' => $promptHash,
                    'raw_markdown' => $rawMarkdown,
                    'parsed' => [
                        'schemas' => $schemaSuggestions,
                        'telemetry' => [
                            'parse_mode' => $parseMode,
                            'schema_dropped' => $schemaDropped,
                            'warnings' => $warningTotals,
                        ],
                    ],
                ]
            );
            return;
        }

        if (!empty($schemaSuggestions)) {
            $project->schemaSuggestions()->updateOrCreate(
                [
                    'prompt_hash' => $promptHash,
                ],
                [
                    'prompt_hash' => $promptHash,
                    'raw_markdown' => $rawMarkdown,
                    'parsed' => [
                        'schemas' => $schemaSuggestions,
                    ],
                ]
            );
            return;
        }

        $project->schemaSuggestions()
            ->where('prompt_hash', $promptHash)
            ->delete();
    }
}
