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
        $clean = [
            'epics' => [],
            'schema_suggestions' => $data['schema_suggestions'] ?? [],
        ];

        $warnings = [
            'dedup_epics' => 0,
            'dedup_stories' => 0,
            'trimmed_epics' => 0,
            'trimmed_stories' => 0,
        ];

        $seenEpics = [];

        foreach (($data['epics'] ?? []) as $epic) {
            $title = trim((string)($epic['title'] ?? ''));
            $stories = is_array($epic['stories'] ?? null) ? $epic['stories'] : [];

            $seenStories = [];
            $uniqueStories = [];

            foreach ($stories as $story) {
                $content = trim((string)($story['content'] ?? ''));

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
                    'status' => $story['status'] ?? null,
                ], static fn ($value) => $value !== null && $value !== '');
            }

            if (count($uniqueStories) > 200) {
                $warnings['trimmed_stories'] += count($uniqueStories) - 200;
                $uniqueStories = array_slice($uniqueStories, 0, 200);
            }

            if ($title === '' && count($uniqueStories) === 0) {
                continue;
            }

            if ($title === '' && count($uniqueStories) > 0) {
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

                if (count($existingStories) > 200) {
                    $excess = count($existingStories) - 200;
                    $warnings['trimmed_stories'] += $excess;
                    $existingStories = array_slice($existingStories, 0, 200);
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

        if (count($clean['epics']) > 50) {
            $warnings['trimmed_epics'] += count($clean['epics']) - 50;
            $clean['epics'] = array_slice($clean['epics'], 0, 50);
        }

        return ['data' => $clean, 'warnings' => $warnings];
    }
}
