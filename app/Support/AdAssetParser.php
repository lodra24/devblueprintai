<?php

namespace App\Support;

use Illuminate\Support\Str;

class AdAssetParser
{
    /**
     * Canonical mapping for various ad asset keys that may arrive
     * in slightly different formats from the AI provider.
     */
    private const KEY_MAP = [
        'varid' => 'var_id',
        'anglecode' => 'angle_code',
        'anglename' => 'angle_name',
        'angle' => 'angle_name',
        'platform' => 'platform',
        'field' => 'field',
        'hook' => 'hook',
        'googleheadline' => 'google_h1',
        'google_headline' => 'google_h1',
        'googleh1' => 'google_h1',
        'googledesc' => 'google_desc',
        'google_description' => 'google_desc',
        'googledescription' => 'google_desc',
        'metaprimary' => 'meta_primary',
        'meta_primary' => 'meta_primary',
        'lph1' => 'lp_h1',
        'lpheadline' => 'lp_h1',
        'emailsubject' => 'email_subject',
        'email_subject' => 'email_subject',
        'reasoning' => 'reasoning',
        'rationale' => 'reasoning',
        'cta' => 'cta',
        'c_t_a' => 'cta',
        'calltoaction' => 'cta',
        'var_i_d' => 'var_id',
    ];

    /**
     * Keys that map directly into the ad assets payload.
     *
     * @var array<string>
     */
    private const ASSET_KEYS = [
        'hook',
        'google_h1',
        'google_desc',
        'meta_primary',
        'lp_h1',
        'email_subject',
        'cta',
    ];

    /**
     * Keys that should be grouped under the reasoning bucket.
     *
     * @var array<string>
     */
    private const REASONING_KEYS = [
        'proof',
        'objection',
        'reasoning',
        'rationale',
    ];

    /**
     * Parse a raw ad asset content string into a structured payload.
     */
    public function parse(?string $content, ?string $angleFromEpic = null): array
    {
        $defaultLimits = config('blueprint.ad_limits', []);

        $meta = [];
        $reasoning = [];
        $assets = [];
        $limits = $defaultLimits;
        $charCounts = [];
        $overLimitFields = [];
        $unparsedSegments = [];

        if (blank($content)) {
            return [
                'meta' => $meta,
                'assets' => $assets,
                'reasoning' => $reasoning,
                'limits' => $limits,
                'char_counts' => $charCounts,
                'over_limit_fields' => $overLimitFields,
                'over_limit_count' => 0,
            ];
        }

        $segments = array_filter(
            array_map('trim', explode('|', $content)),
            static fn (string $segment) => $segment !== ''
        );

        foreach ($segments as $segment) {
            $parsed = $this->parseSegment($segment);

            if ($parsed === null) {
                $unparsedSegments[] = $segment;
                continue;
            }

            $normalizedKey = $this->normalizeKey($parsed['key']);
            $value = $parsed['value'];
            $explicitLimit = $parsed['limit'];

            if ($explicitLimit !== null) {
                $limits[$normalizedKey] = $explicitLimit;
            }

            $appliedLimit = $limits[$normalizedKey] ?? null;

            if ($this->isReasoningKey($normalizedKey)) {
                $reasoning[$normalizedKey] = $value;
                continue;
            }

            if ($this->isAssetKey($normalizedKey)) {
                $assets[$normalizedKey] = $value;
                $charCounts[$normalizedKey] = $this->characterLength($value);

                if ($appliedLimit !== null && $charCounts[$normalizedKey] > $appliedLimit) {
                    $overLimitFields[$normalizedKey] = $charCounts[$normalizedKey] - $appliedLimit;
                }

                continue;
            }

            $meta[$normalizedKey] = $value;
        }

        if ($unparsedSegments !== []) {
            $meta['_unparsed_segments'] = $unparsedSegments;
        }

        if (
            $angleFromEpic !== null
            && (!array_key_exists('angle_name', $meta) || trim((string) $meta['angle_name']) === '')
        ) {
            $meta['angle_name'] = $angleFromEpic;
        }

        return [
            'meta' => $meta,
            'assets' => $assets,
            'reasoning' => $reasoning,
            'limits' => $limits,
            'char_counts' => $charCounts,
            'over_limit_fields' => array_keys($overLimitFields),
            'over_limit_count' => count($overLimitFields),
        ];
    }

    /**
     * Normalize an incoming key to its canonical snake_case version.
     */
    private function normalizeKey(string $rawKey): string
    {
        $collapsed = strtolower(preg_replace('/[^a-z0-9]+/i', '', $rawKey) ?? '');

        if (isset(self::KEY_MAP[$collapsed])) {
            return self::KEY_MAP[$collapsed];
        }

        return Str::snake(trim($rawKey));
    }

    /**
     * Attempt to extract the key, limit, and value from a segment string.
     *
     * @return array{key: string, value: string, limit: ?int}|null
     */
    private function parseSegment(string $segment): ?array
    {
        $pattern = '/^\s*(?P<key>[A-Za-z0-9 _-]+)\s*(?:(?:<\s*=?|≤)\s*(?P<limit>\d+)?)?\s*(?:[:=])\s*(?P<value>.+)\s*$/u';

        if (!preg_match($pattern, $segment, $matches)) {
            return null;
        }

        $value = trim($matches['value']);

        if ($value !== '') {
            $value = $this->stripWrappingQuotes($value);
            $value = trim($value);
        }

        return [
            'key' => trim($matches['key']),
            'value' => $value,
            'limit' => isset($matches['limit']) && $matches['limit'] !== '' ? (int) $matches['limit'] : null,
        ];
    }

    private function stripWrappingQuotes(string $value): string
    {
        $firstCharacter = $value[0] ?? '';
        $lastCharacter = substr($value, -1);

        if ($firstCharacter === '"' && $lastCharacter === '"') {
            return stripcslashes(substr($value, 1, -1));
        }

        if ($firstCharacter === "'" && $lastCharacter === "'") {
            return stripcslashes(substr($value, 1, -1));
        }

        return stripcslashes($value);
    }

    private function characterLength(string $value): int
    {
        return mb_strlen($value);
    }

    private function isAssetKey(string $key): bool
    {
        return in_array($key, self::ASSET_KEYS, true);
    }

    private function isReasoningKey(string $key): bool
    {
        return in_array($key, self::REASONING_KEYS, true);
    }
}
