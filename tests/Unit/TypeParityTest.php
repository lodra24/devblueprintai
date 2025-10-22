<?php

namespace Tests\Unit;

use App\Enums\ProjectStatus;
use Tests\TestCase;

class TypeParityTest extends TestCase
{
    public function test_project_status_union_matches_backend_enum(): void
    {
        $tsPath = resource_path('js/types/Project.ts');
        $this->assertFileExists($tsPath, 'Expected Project.ts file to exist for type parity check.');

        $contents = file_get_contents($tsPath);
        $this->assertNotFalse($contents, 'Unable to read Project.ts contents.');

        $pattern = '/export\s+type\s+ProjectStatus\s*=\s*((?:\s*\|\s*"[^"]+"\s*)+);/m';
        $this->assertMatchesRegularExpression(
            $pattern,
            $contents,
            'Unable to parse ProjectStatus union from Project.ts.'
        );

        preg_match($pattern, $contents, $match);
        preg_match_all('/"([^"]+)"/', $match[1], $tsMatches);

        $tsValues = collect($tsMatches[1])->sort()->values()->all();
        $phpValues = collect(ProjectStatus::cases())->map->value->sort()->values()->all();

        $this->assertSame(
            $phpValues,
            $tsValues,
            'ProjectStatus union in frontend types is out of sync with backend enum.'
        );
    }
}

