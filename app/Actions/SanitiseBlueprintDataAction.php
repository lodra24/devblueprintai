<?php

namespace App\Actions;

use App\Support\BlueprintKeyFactory;

class SanitiseBlueprintDataAction
{
    /**
     * Normalize the AI output and deduplicate epics/stories.
     *
     * @return array{data: array, warnings: array}
     */
    public function __invoke(array $data): array
    {
        $limits = config('blueprint.limits');
        $maxEpics = (int) ($limits['epics'] ?? 50);
        $maxStories = (int) ($limits['stories_per_epic'] ?? 200);
        $maxSchemas = (int) ($limits['schemas'] ?? 50);
        $maxColumns = (int) ($limits['columns_per_table'] ?? 100);
        $maxTitle = (int) ($limits['title_max'] ?? 255);
        $maxStory = (int) ($limits['story_max'] ?? 1000);
        $maxColumnToken = (int) ($limits['column_token_max'] ?? 255);

        $clean = [
            'epics' => [],
            'schema_suggestions' => [],
        ];

        $warnings = [
            'dedup_epics' => 0,
            'dedup_stories' => 0,
            'trimmed_epics' => 0,
            'trimmed_stories' => 0,
            'dedup_schemas' => 0,
            'trimmed_schemas' => 0,
            'trimmed_schema_columns' => 0,
            'trimmed_titles' => 0,
            'trimmed_story_chars' => 0,
            'trimmed_column_tokens' => 0,
            'invalid_schema_tokens' => 0,
        ];

        $seenEpics = [];
        $epics = is_array($data['epics'] ?? null) ? $data['epics'] : [];

        foreach ($epics as $epic) {
            $title = $this->stripMarkdownFormatting(trim((string) ($epic['title'] ?? '')));
            $originalTitleLength = mb_strlen($title);
            $title = $this->limitLen($title, $maxTitle);
            if ($originalTitleLength > $maxTitle) {
                $warnings['trimmed_titles']++;
            }
            $stories = is_array($epic['stories'] ?? null) ? $epic['stories'] : [];

            $seenStories = [];
            $uniqueStories = [];

            foreach ($stories as $story) {
                $content = $this->stripMarkdownFormatting(trim((string) ($story['content'] ?? '')));
                $originalStoryLength = mb_strlen($content);
                $content = $this->limitLen($content, $maxStory);
                if ($originalStoryLength > $maxStory) {
                    $warnings['trimmed_story_chars'] += $originalStoryLength - $maxStory;
                }

                if ($content === '') {
                    continue;
                }

                $storyKey = BlueprintKeyFactory::story($content);

                if (isset($seenStories[$storyKey])) {
                    $warnings['dedup_stories']++;
                    continue;
                }

                $seenStories[$storyKey] = true;

                $uniqueStories[] = array_filter([
                    'content' => $content,
                    'priority' => $story['priority'] ?? null,
                ], static fn ($value) => $value !== null && $value !== '');
            }

            if (count($uniqueStories) > $maxStories) {
                $warnings['trimmed_stories'] += count($uniqueStories) - $maxStories;
                $uniqueStories = array_slice($uniqueStories, 0, $maxStories);
            }

            if (count($uniqueStories) === 0) {
                continue;
            }

            if ($title === '') {
                $storyKeys = array_map(
                    fn ($storyItem) => BlueprintKeyFactory::story($storyItem['content']),
                    $uniqueStories
                );

                sort($storyKeys, SORT_STRING);

                $contentHash = sha1(implode('|', $storyKeys));
                $epicKey = 'untitled:' . $contentHash;
                $title = sprintf('Untitled (%s)', substr($contentHash, 0, 8));
            } else {
                $epicKey = BlueprintKeyFactory::epic($title);
            }

            if (isset($seenEpics[$epicKey])) {
                $index = $seenEpics[$epicKey];
                $existingStories = &$clean['epics'][$index]['stories'];

                $existingStoryKeys = [];

                foreach ($existingStories as $existingStory) {
                    $existingStoryKeys[BlueprintKeyFactory::story($existingStory['content'])] = true;
                }

                foreach ($uniqueStories as $uniqueStory) {
                    $uniqueStoryKey = BlueprintKeyFactory::story($uniqueStory['content']);

                    if (isset($existingStoryKeys[$uniqueStoryKey])) {
                        $warnings['dedup_stories']++;
                        continue;
                    }

                    $existingStories[] = $uniqueStory;
                    $existingStoryKeys[$uniqueStoryKey] = true;
                }

                if (count($existingStories) > $maxStories) {
                    $excess = count($existingStories) - $maxStories;
                    $warnings['trimmed_stories'] += $excess;
                    $existingStories = array_slice($existingStories, 0, $maxStories);
                    $clean['epics'][$index]['stories'] = $existingStories;
                }

                $warnings['dedup_epics']++;

                continue;
            }

            $seenEpics[$epicKey] = count($clean['epics']);

            $clean['epics'][] = [
                'title' => $title,
                'stories' => $uniqueStories,
            ];
        }

        if (count($clean['epics']) > $maxEpics) {
            $warnings['trimmed_epics'] += count($clean['epics']) - $maxEpics;
            $clean['epics'] = array_slice($clean['epics'], 0, $maxEpics);
        }

        $schemaSuggestions = is_array($data['schema_suggestions'] ?? null) ? $data['schema_suggestions'] : [];
        $seenSchemas = [];
        // Persona Snapshot: accept any non-empty single-line text for columns
        $columnPattern = '/^.+$/u';

        foreach ($schemaSuggestions as $schema) {
            $tableName = $this->stripMarkdownFormatting(trim((string) ($schema['table_name'] ?? '')));
            $tableName = strtolower($tableName);

            if ($tableName === '') {
                continue;
            }

            $columnsInput = is_array($schema['columns'] ?? null) ? $schema['columns'] : [];
            $columnValues = [];
            $seenColumns = [];

            foreach ($columnsInput as $column) {
                $columnText = $this->stripMarkdownFormatting(trim((string) $column));
                $columnText = preg_replace('/\s+/', ' ', $columnText) ?? $columnText;
                $originalColumnLength = mb_strlen($columnText);
                $columnText = $this->limitLen($columnText, $maxColumnToken);
                if ($originalColumnLength > $maxColumnToken) {
                    $warnings['trimmed_column_tokens']++;
                }

                if (!preg_match($columnPattern, $columnText)) {
                    $warnings['invalid_schema_tokens']++;
                    continue;
                }

                if ($columnText === '') {
                    continue;
                }

                if (isset($seenColumns[$columnText])) {
                    continue;
                }

                $seenColumns[$columnText] = true;
                $columnValues[] = $columnText;
            }

            if (empty($columnValues)) {
                continue;
            }

            if (count($columnValues) > $maxColumns) {
                $warnings['trimmed_schema_columns'] += count($columnValues) - $maxColumns;
                $columnValues = array_slice($columnValues, 0, $maxColumns);
            }

            if (isset($seenSchemas[$tableName])) {
                $warnings['dedup_schemas']++;
                $index = $seenSchemas[$tableName];
                $existingColumns = $clean['schema_suggestions'][$index]['columns'];
                $mergedColumns = array_values(array_unique(array_merge($existingColumns, $columnValues)));

                if (count($mergedColumns) > $maxColumns) {
                    $warnings['trimmed_schema_columns'] += count($mergedColumns) - $maxColumns;
                    $mergedColumns = array_slice($mergedColumns, 0, $maxColumns);
                }

                $clean['schema_suggestions'][$index]['columns'] = $mergedColumns;
                continue;
            }

            $seenSchemas[$tableName] = count($clean['schema_suggestions']);
            $clean['schema_suggestions'][] = [
                'table_name' => $tableName,
                'columns' => $columnValues,
            ];
        }

        if (count($clean['schema_suggestions']) > $maxSchemas) {
            $warnings['trimmed_schemas'] += count($clean['schema_suggestions']) - $maxSchemas;
            $clean['schema_suggestions'] = array_slice($clean['schema_suggestions'], 0, $maxSchemas);
        }

        $clean['schema_suggestions'] = array_values($clean['schema_suggestions']);

        return ['data' => $clean, 'warnings' => $warnings];
    }

    private function stripMarkdownFormatting(string $value): string
    {
        $value = trim($value);
        $value = preg_replace('/^[*_`~]+|[*_`~]+$/u', '', $value) ?? $value;
        $value = preg_replace('/`([^`]+)`/u', '$1', $value) ?? $value;
        $value = preg_replace('/\*\*(.+?)\*\*/u', '$1', $value) ?? $value;
        $value = preg_replace('/__(.+?)__/u', '$1', $value) ?? $value;
        $value = preg_replace('/~~(.+?)~~/u', '$1', $value) ?? $value;
        $value = preg_replace('/\s{2,}/', ' ', $value) ?? $value;

        return trim($value);
    }

    private function limitLen(string $value, int $max): string
    {
        return mb_strlen($value) > $max ? mb_substr($value, 0, $max) : $value;
    }
}

