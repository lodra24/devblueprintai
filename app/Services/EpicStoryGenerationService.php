<?php

namespace App\Services;

use App\Exceptions\AiGenerationException;
use App\Models\Epic;
use App\Models\UserStory;
use App\Support\UserStoryVarIdGenerator;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class EpicStoryGenerationService
{
    private const POSITION_STEP = 100;

    public function __construct(
        private AiGenerationService $aiService,
        private UserStoryVarIdGenerator $varIdGenerator,
    ) {
    }

    /**
     * Generate a single AI user story for the given epic and persist it.
     *
     * @throws AiGenerationException
     */
    public function generateAndPersist(Epic $epic): UserStory
    {
        $epic->loadMissing('project', 'userStories');

        $prompt = $this->buildPrompt($epic);
        $raw = $this->aiService->generateWithPrompt($epic->project, $prompt, 'epic_story', false);
        $storyData = $this->extractStoryData($raw);
        $promptHash = $this->aiService->calculatePromptHash($epic->project, $prompt);

        $varId = $this->varIdGenerator->generateForEpic($epic);
        $content = $this->injectVarId($storyData['content'], $varId);

        $position = (int) $epic->userStories()->max('position');
        $position = ($position ?: 0) + self::POSITION_STEP;

        /** @var UserStory $userStory */
        $userStory = $epic->userStories()->create([
            'content' => $content,
            'priority' => $storyData['priority'] ?? 'medium',
            'position' => $position,
            'is_ai_generated' => true,
            'origin_prompt_hash' => $promptHash,
        ]);

        $userStory->load('epic');

        return $userStory;
    }

    private function buildPrompt(Epic $epic): string
    {
        $project = $epic->project;
        $existing = $epic->userStories->pluck('content')->filter()->values()->all();

        $lines = [
            "Brand/Offer: {$project->name}",
        ];

        if (!empty($project->idea_text)) {
            $lines[] = "Marketing context: {$project->idea_text}";
        }

        $lines[] = "Target angle (use ONLY this angle, do not create new angles): {$epic->title}";

        if (!empty($existing)) {
            $lines[] = "Existing examples for this angle (do NOT repeat or paraphrase):";
            foreach ($existing as $content) {
                $lines[] = "- {$content}";
            }
        }

        $lines[] = "Return JSON with exactly one epic and one story for this angle. epics[0].title must equal \"{$epic->title}\". epics[0].stories array length should be 1.";
        $lines[] = "Make the new story meaningfully different from the examples above.";
        $lines[] = "Unique Request ID: " . Str::uuid()->toString();

        return implode("\n\n", $lines);
    }

    /**
     * @return array{content: string, priority: string}
     */
    private function extractStoryData(string $raw): array
    {
        $decoded = json_decode($raw, true);

        if (!is_array($decoded)) {
            throw new AiGenerationException('AI response is not valid JSON.');
        }

        $container = $decoded;
        if (array_is_list($decoded)) {
            $container = $decoded[0] ?? [];
        }

        if (!is_array($container)) {
            throw new AiGenerationException('AI response is not in expected format.');
        }

        $epics = $container['epics'] ?? null;
        if (!is_array($epics) || empty($epics)) {
            throw new AiGenerationException('AI response missing epics.');
        }

        $firstEpic = is_array($epics[0] ?? null) ? $epics[0] : null;
        if (!$firstEpic) {
            throw new AiGenerationException('AI response has no epic payload.');
        }

        $stories = $firstEpic['stories'] ?? null;
        if (!is_array($stories) || empty($stories) || !is_array($stories[0] ?? null)) {
            throw new AiGenerationException('AI response missing stories for epic.');
        }

        $story = $stories[0];
        $content = trim((string) Arr::get($story, 'content', ''));

        if ($content === '') {
            throw new AiGenerationException('AI response story content is empty.');
        }

        $priority = $this->normalisePriority(Arr::get($story, 'priority'));

        return [
            'content' => $content,
            'priority' => $priority,
        ];
    }

    private function normalisePriority($priority): string
    {
        $value = is_string($priority) ? strtolower(trim($priority)) : '';

        return in_array($value, ['low', 'medium', 'high'], true) ? $value : 'medium';
    }

    private function injectVarId(string $content, string $varId): string
    {
        $segments = array_values(array_filter(
            array_map('trim', explode('|', $content)),
            static fn (?string $segment) => !blank($segment)
        ));

        $filtered = [];
        foreach ($segments as $segment) {
            $normalizedKey = $this->extractKey($segment);
            if ($normalizedKey === 'varid') {
                continue;
            }
            $filtered[] = $segment;
        }

        array_unshift($filtered, "VarID={$varId}");

        return implode(' | ', $filtered);
    }

    private function extractKey(string $segment): ?string
    {
        if (!preg_match('/^\s*([A-Za-z0-9 _-]+)\s*[:=]/', $segment, $matches)) {
            return null;
        }

        $collapsed = strtolower(preg_replace('/[^a-z0-9]+/i', '', $matches[1] ?? '') ?? '');

        return $collapsed === '' ? null : $collapsed;
    }
}
