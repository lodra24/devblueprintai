<?php

namespace App\Parsing;

use Illuminate\Support\Str;

class BlueprintMarkdownParser
{
    /**
     * Parse the AI generated markdown into structured blueprint data.
     *
     * @return array{epics: array<int, array{title: string, stories: array<int, array{content: string, priority?: string|null, status?: string|null}>}>, schema_suggestions: array<int, array{table_name: string, columns: array<int, string>}>}
     */
    public function parse(string $markdown): array
    {
        $normalized = preg_replace("/\r\n?/", "\n", (string) $markdown);
        $lines = preg_split('/\n+/', trim((string) $normalized)) ?: [];

        $data = [
            'epics' => [],
            'schema_suggestions' => [],
        ];

        $currentEpic = null;
        $section = 'epics';

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            if ($this->isSchemaHeading($line)) {
                $section = 'schema';
                $this->flushEpic($currentEpic, $data);
                $currentEpic = null;
                continue;
            }

            if ($this->isEpicHeading($line)) {
                $section = 'epics';
                $this->flushEpic($currentEpic, $data);
                $currentEpic = [
                    'title' => $this->extractEpicTitle($line),
                    'stories' => [],
                ];
                continue;
            }

            if ($section === 'schema') {
                $schema = $this->parseSchemaLine($line);
                if ($schema !== null) {
                    $data['schema_suggestions'][] = $schema;
                }
                continue;
            }

            if ($section === 'epics' && $currentEpic !== null) {
                $story = $this->parseStoryLine($line);
                if ($story !== null) {
                    $currentEpic['stories'][] = $story;
                }
            }
        }

        $this->flushEpic($currentEpic, $data);

        return $data;
    }

    private function flushEpic(?array &$epic, array &$data): void
    {
        if ($epic === null) {
            return;
        }

        // Remove empty epics that have no usable title or stories
        $epic['title'] = trim($epic['title']);
        $epic['stories'] = array_values(array_filter(
            $epic['stories'],
            fn (array $story) => trim($story['content']) !== ''
        ));

        if (!empty($epic['stories'])) {
            $data['epics'][] = $epic;
        }

        $epic = null;
    }

    private function isEpicHeading(string $line): bool
    {
        return (bool) preg_match('/^#{2,}\s*(?:epic\b[:\-]?\s*)?.*/i', $line);
    }

    private function isSchemaHeading(string $line): bool
    {
        $stripped = preg_replace('/[*_`]+/', '', $line);

        return (bool) preg_match(
            '/^#{2,}\s*(?:database|data\s*model|schema)\s*(?:schema)?\s*(?:suggestions?|design|model)?/i',
            $stripped ?? $line
        );
    }

    private function extractEpicTitle(string $line): string
    {
        $title = preg_replace('/^#{2,}\s*/', '', $line);
        $title = preg_replace('/^epic\b[:\-]?\s*/i', '', $title);

        $title = preg_replace('/[*_`~]+/', '', $title ?? '');

        return trim((string) $title);
    }

    /**
     * @return array{content: string, priority?: string|null, status?: string|null}|null
     */
    private function parseStoryLine(string $line): ?array
    {
        if (!preg_match('/^(?:[-*\x{2022}\x{2013}\x{2014}]|\d+[.)])\s*(.+)$/u', $line, $matches)) {
            return null;
        }

        $content = trim($matches[1]);

        // Remove optional leading label
        $content = preg_replace('/^(user\s+story|story)\s*[:\-]\s*/i', '', $content);

        // Remove any leftover bullet markers from nested lists (e.g. "- * Story")
        $content = preg_replace('/^(?:[-*\x{2022}\x{2013}\x{2014}]|\d+[.)])\s*/u', '', $content);

        [$content, $meta] = $this->extractStoryMetadata($content);

        $story = [
            'content' => $content,
        ];

        if ($meta['priority'] !== null) {
            $story['priority'] = $meta['priority'];
        }
        if ($meta['status'] !== null) {
            $story['status'] = $meta['status'];
        }

        return $story;
    }

    /**
     * @return array{string, array{priority: ?string, status: ?string}}
     */
    private function extractStoryMetadata(string $content): array
    {
        $meta = [
            'priority' => null,
            'status' => null,
        ];

        // Extract bracketed metadata e.g. [Priority: High] [Status: In Progress]
        $content = preg_replace_callback('/\[(priority|status)\s*:\s*([^\]]+)\]/i', function ($matches) use (&$meta) {
            $key = strtolower($matches[1]);
            $value = $this->normaliseMetaValue($key, $matches[2]);
            if ($value !== null) {
                $meta[$key] = $value;
            }
            return '';
        }, $content);

        // Extract pipe-separated metadata e.g. Story text | Priority: High | Status: Todo
        $segments = array_map('trim', explode('|', $content));
        if (count($segments) > 1) {
            $content = array_shift($segments);
            foreach ($segments as $segment) {
                if (preg_match('/^(priority|status)\s*[:=]\s*(.+)$/i', $segment, $matches)) {
                    $key = strtolower($matches[1]);
                    $value = $this->normaliseMetaValue($key, $matches[2]);
                    if ($value !== null) {
                        $meta[$key] = $value;
                    }
                }
            }
        }

        // Extract trailing metadata in parentheses e.g. (Priority: High, Status: Todo)
        $content = preg_replace_callback('/\(([^)]+)\)$/', function ($matches) use (&$meta) {
            $pairs = preg_split('/[,;]+/', $matches[1]);
            foreach ($pairs as $pair) {
                if (preg_match('/(priority|status)\s*[:=]\s*(.+)/i', $pair, $metaMatch)) {
                    $key = strtolower($metaMatch[1]);
                    $value = $this->normaliseMetaValue($key, $metaMatch[2]);
                    if ($value !== null) {
                        $meta[$key] = $value;
                    }
                }
            }
            return '';
        }, $content);

        return [trim(preg_replace('/\s{2,}/', ' ', $content)), $meta];
    }

    private function normaliseMetaValue(string $key, string $value): ?string
    {
        $value = strtolower(trim($value));
        $value = str_replace(['-', ' '], '_', $value);

        if ($key === 'priority') {
            return in_array($value, ['low', 'medium', 'high'], true) ? $value : null;
        }

        if ($key === 'status') {
            $map = [
                'inprogress' => 'in_progress',
                'in_progress' => 'in_progress',
                'progress' => 'in_progress',
                'todo' => 'todo',
                'not_started' => 'todo',
                'done' => 'done',
                'completed' => 'done',
            ];

            return $map[$value] ?? ($map[str_replace('_', '', $value)] ?? null);
        }

        return null;
    }

    /**
     * @return array{table_name: string, columns: array<int, string>}|null
     */
    private function parseSchemaLine(string $line): ?array
    {
        // Remove list prefixes or code fences
        $line = preg_replace('/^(?:[-*\x{2022}\x{2013}\x{2014}]|\d+[.)])\s*/u', '', $line);
        $line = trim($line, '` ');

        if ($line === '') {
            return null;
        }

        if (!preg_match('/^`?([A-Za-z_][A-Za-z0-9_]*)`?(?:\s*(?:table)?\s*)?\((.+)\)$/', $line, $matches)) {
            // Attempt to parse formats like "Table: users | Columns: id, name"
            if (preg_match('/table\s*[:\-]\s*([A-Za-z_][A-Za-z0-9_]*)/i', $line, $tableMatch)) {
                $columns = [];
                if (preg_match('/columns?\s*[:\-]\s*(.+)$/i', $line, $columnMatch)) {
                    $columns = $this->normaliseColumns($columnMatch[1]);
                }

                if (!empty($columns)) {
                    return [
                        'table_name' => strtolower($tableMatch[1]),
                        'columns' => $columns,
                    ];
                }
            }

            // Attempt to parse formats like "users: id:int, name:varchar(255)"
            if (preg_match('/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)$/', $line, $colonMatch)) {
                $columns = $this->normaliseColumns($colonMatch[2]);

                if (!empty($columns)) {
                    return [
                        'table_name' => strtolower($colonMatch[1]),
                        'columns' => $columns,
                    ];
                }
            }

            return null;
        }

        return [
            'table_name' => strtolower($matches[1]),
            'columns' => $this->normaliseColumns($matches[2]),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function normaliseColumns(string $columns): array
    {
        $columns = preg_split('/,|\|/', $columns) ?: [];

        return array_values(array_filter(array_map(function ($column) {
            $column = trim($column, " `\t\n\r\0\x0B");
            $column = preg_replace('/\s+/', ' ', $column);
            $column = preg_replace('/[^A-Za-z0-9_\s:(),]/', '', $column);
            return $column !== '' ? strtolower($column) : null;
        }, $columns)));
    }
}
