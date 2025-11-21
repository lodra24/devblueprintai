<?php

namespace App\Support;

use App\Models\Epic;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class UserStoryVarIdGenerator
{
    public function __construct(private AdAssetParser $assetParser)
    {
    }

    /**
     * Generate a new VarID for the given epic based on existing stories.
     */
    public function generateForEpic(Epic $epic): string
    {
        $epic->loadMissing('userStories');

        $existing = $this->collectExistingVarIds($epic);
        $prefix = $this->resolvePrefix($existing, $epic->title);
        $nextNumber = $this->resolveNextNumber($existing, $epic->userStories->count());
        $width = max($this->maxDigits($existing), 2);

        return $prefix . '-' . str_pad((string) $nextNumber, $width, '0', STR_PAD_LEFT);
    }

    /**
     * @return array<int, array{prefix: string, number: int, width: int}>
     */
    private function collectExistingVarIds(Epic $epic): array
    {
        $found = [];

        foreach ($epic->userStories as $story) {
            $parsed = $this->assetParser->parse($story->content ?? '', $epic->title ?? null);
            $varId = Arr::get($parsed, 'meta.var_id');

            if (!is_string($varId) || trim($varId) === '') {
                continue;
            }

            if (!preg_match('/^([A-Za-z]+)-?(\d+)/', $varId, $matches)) {
                continue;
            }

            $prefix = strtoupper($matches[1]);
            $number = (int) $matches[2];
            $width = strlen($matches[2]);

            if ($prefix === '' || $number < 0) {
                continue;
            }

            $found[] = [
                'prefix' => $prefix,
                'number' => $number,
                'width' => $width,
            ];
        }

        return $found;
    }

    private function resolvePrefix(array $existing, ?string $epicTitle): string
    {
        if ($existing !== []) {
            $frequency = [];
            foreach ($existing as $item) {
                $frequency[$item['prefix']] = ($frequency[$item['prefix']] ?? 0) + 1;
            }

            arsort($frequency);
            $topPrefix = array_key_first($frequency);
            if ($topPrefix !== null && $topPrefix !== '') {
                return $topPrefix;
            }
        }

        $fallback = Str::of((string) $epicTitle)
            ->ascii()
            ->replace(['Angle', 'angle'], '')
            ->trim()
            ->squish()
            ->explode(' ')
            ->filter(fn ($part) => $part !== '')
            ->map(fn ($part) => Str::upper(Str::substr($part, 0, 1)))
            ->implode('');

        $prefix = Str::upper(Str::substr($fallback, 0, 3));

        if ($prefix === '') {
            return 'VR';
        }

        return $prefix;
    }

    private function resolveNextNumber(array $existing, int $storyCount): int
    {
        if ($existing === []) {
            return $storyCount + 1;
        }

        $max = 0;
        foreach ($existing as $item) {
            $max = max($max, $item['number']);
        }

        return $max + 1;
    }

    private function maxDigits(array $existing): int
    {
        $max = 0;
        foreach ($existing as $item) {
            $max = max($max, $item['width']);
        }

        return $max;
    }
}
