<?php

namespace App\Support;

use Illuminate\Support\Str;

class AdAssetFormatter
{
    /**
     * Preferred output labels for known keys to avoid spacey versions.
     */
    private const OUTPUT_ALIASES = [
        'var_id' => 'VarID',
        'angle_name' => 'AngleName',
        'platform' => 'Platform',
        'field' => 'Field',
        'hook' => 'Hook',
        'google_h1' => 'GoogleH1',
        'google_desc' => 'GoogleDesc',
        'meta_primary' => 'MetaPrimary',
        'lp_h1' => 'LPH1',
        'email_subject' => 'EmailSubject',
        'cta' => 'CTA',
        'proof' => 'Proof',
        'objection' => 'Objection',
    ];

    private const META_ORDER = [
        'var_id',
        'angle_name',
        'platform',
        'field',
    ];

    private const ASSET_ORDER = [
        'hook',
        'google_h1',
        'google_desc',
        'meta_primary',
        'lp_h1',
        'email_subject',
        'cta',
    ];

    private const REASONING_ORDER = [
        'proof',
        'objection',
    ];

    /**
     * Build a serialized ad-asset string from structured buckets.
     *
     * @param array{
     *   meta?: array<string, scalar|null>,
     *   assets?: array<string, scalar|null>,
     *   reasoning?: array<string, scalar|null>,
     *   limits?: array<string, int|null>
     * } $payload
     */
    public function format(array $payload): string
    {
        $meta = $payload['meta'] ?? [];
        $assets = $payload['assets'] ?? [];
        $reasoning = $payload['reasoning'] ?? [];
        $limits = $payload['limits'] ?? [];

        $segments = [];

        // Meta in a stable order first.
        foreach (self::META_ORDER as $key) {
            if ($this->hasValue($meta[$key] ?? null)) {
                $segments[] = $this->segment($key, $meta[$key], $limits[$key] ?? null);
            }
            unset($meta[$key]);
        }

        // Remaining meta keys.
        foreach ($meta as $key => $value) {
            if ($this->hasValue($value)) {
                $segments[] = $this->segment($key, $value, $limits[$key] ?? null);
            }
        }

        // Assets in stable order.
        foreach (self::ASSET_ORDER as $key) {
            if ($this->hasValue($assets[$key] ?? null)) {
                $segments[] = $this->segment($key, $assets[$key], $limits[$key] ?? null);
            }
            unset($assets[$key]);
        }

        // Remaining assets.
        foreach ($assets as $key => $value) {
            if ($this->hasValue($value)) {
                $segments[] = $this->segment($key, $value, $limits[$key] ?? null);
            }
        }

        // Reasoning in stable order.
        foreach (self::REASONING_ORDER as $key) {
            if ($this->hasValue($reasoning[$key] ?? null)) {
                $segments[] = $this->segment($key, $reasoning[$key], $limits[$key] ?? null);
            }
            unset($reasoning[$key]);
        }

        // Remaining reasoning.
        foreach ($reasoning as $key => $value) {
            if ($this->hasValue($value)) {
                $segments[] = $this->segment($key, $value, $limits[$key] ?? null);
            }
        }

        return implode(' | ', $segments);
    }

    private function hasValue(mixed $value): bool
    {
        if (is_string($value)) {
            return trim($value) !== '';
        }

        return $value !== null;
    }

    private function segment(string $key, mixed $value, mixed $limit): string
    {
        $label = $this->formatKey($key);
        $text = is_scalar($value) ? (string) $value : '';
        $text = $this->escapeValue($text);
        $limitPart = $this->formatLimit($limit);

        return $limitPart !== null
            ? "{$label}{$limitPart}: {$text}"
            : "{$label}: {$text}";
    }

    private function formatKey(string $key): string
    {
        $normalized = Str::snake($key);
        if (isset(self::OUTPUT_ALIASES[$normalized])) {
            return self::OUTPUT_ALIASES[$normalized];
        }

        // Collapse snake_case to StudlyCase without spaces (parser tolerates both).
        return str_replace(' ', '', Str::title(str_replace('_', ' ', $normalized)));
    }

    private function formatLimit(mixed $limit): ?string
    {
        if ($limit === null) {
            return null;
        }

        $intLimit = is_numeric($limit) ? (int) $limit : null;

        return $intLimit !== null ? "<={$intLimit}" : null;
    }

    private function escapeValue(string $value): string
    {
        // Preserve backslashes first, then escape pipe so parser won't split.
        $escaped = str_replace('\\', '\\\\', $value);
        $escaped = str_replace('|', '\\|', $escaped);

        return $escaped;
    }
}
