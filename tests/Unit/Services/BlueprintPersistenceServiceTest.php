<?php

namespace Tests\Unit\Services;

use App\Actions\SanitiseBlueprintDataAction;
use App\Actions\ValidateBlueprintDataAction;
use App\Models\Project;
use App\Parsing\BlueprintMarkdownParser;
use App\Services\BlueprintPersistenceService;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BlueprintPersistenceServiceTest extends TestCase
{
    use RefreshDatabase;

    private BlueprintPersistenceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new BlueprintPersistenceService(
            new ValidateBlueprintDataAction(),
            new BlueprintMarkdownParser(),
            new SanitiseBlueprintDataAction()
        );
    }

    public function test_it_persists_parsed_markdown_with_metadata(): void
    {
        $project = Project::factory()->create();
        $promptHash = sha1('prompt-one');
        $markdown = <<<MD
        ## Epic: User Management
        - User Story: As a user, I want to register. [Priority: High] [Status: Todo]
        - * As a user, I want to log in. | Priority: medium | Status: in progress

        ### Database Schema Suggestions
        `users` (id, name, email, password_hash)
        `projects` (id, user_id, name, status)
        MD;

        $this->service->persist($project, $markdown, $promptHash);

        $this->assertDatabaseHas('epics', [
            'project_id' => $project->id,
            'title' => 'User Management',
            'is_ai_generated' => true,
            'origin_prompt_hash' => $promptHash,
        ]);

        $this->assertDatabaseHas('user_stories', [
            'content' => 'As a user, I want to register.',
            'priority' => 'high',
            'status' => 'todo',
            'is_ai_generated' => true,
            'origin_prompt_hash' => $promptHash,
        ]);

        $this->assertDatabaseHas('user_stories', [
            'content' => 'As a user, I want to log in.',
            'priority' => 'medium',
            'status' => 'in_progress',
            'is_ai_generated' => true,
            'origin_prompt_hash' => $promptHash,
        ]);

        $this->assertDatabaseHas('schema_suggestions', [
            'project_id' => $project->id,
            'prompt_hash' => $promptHash,
        ]);

        $schemaSuggestion = $project->fresh()->schemaSuggestions()->latest()->first();
        $this->assertNotNull($schemaSuggestion);

        $parsed = $schemaSuggestion->parsed;
        $this->assertIsArray($parsed['schemas'] ?? null);
        $this->assertArrayHasKey('telemetry', $parsed);
        $this->assertSame('markdown_fallback', $parsed['telemetry']['parse_mode'] ?? null);
        $this->assertFalse($parsed['telemetry']['schema_dropped'] ?? true);
        $this->assertEquals(
            0,
            array_sum($parsed['telemetry']['warnings'] ?? [])
        );
        $this->assertSame('users', $parsed['schemas'][0]['table_name']);
        $this->assertSame(
            ['id', 'name', 'email', 'password_hash'],
            $parsed['schemas'][0]['columns']
        );
    }

    public function test_it_is_idempotent_for_same_prompt_hash(): void
    {
        $project = Project::factory()->create();
        $promptHash = sha1('prompt-two');
        $markdown = "## Epic: Platform\n- Story: First Story";

        $this->service->persist($project, $markdown, $promptHash);
        $epicId = $project->epics()->where('title', 'Platform')->value('id');
        $storyId = $project->userStories()->where('content', 'First Story')->value('id');

        // Run again with the same data and prompt hash
        $this->service->persist($project->fresh(), $markdown, $promptHash);

        $this->assertSame($epicId, $project->fresh()->epics()->where('title', 'Platform')->value('id'));
        $this->assertSame($storyId, $project->fresh()->userStories()->where('content', 'First Story')->value('id'));
        $this->assertEquals(1, $project->fresh()->epics()->where('is_ai_generated', true)->count());
        $this->assertEquals(1, $project->fresh()->userStories()->where('user_stories.is_ai_generated', true)->count());
    }

    public function test_it_preserves_user_owned_content_when_refreshing_ai_data(): void
    {
        $project = Project::factory()->create();
        $manualEpic = $project->epics()->create([
            'title' => 'Manual Epic',
            'position' => 10,
            'is_ai_generated' => false,
        ]);

        $firstHash = sha1('prompt-three');
        $secondHash = sha1('prompt-four');

        $firstMarkdown = "## Epic: AI Epic\n- Story: AI Story";
        $secondMarkdown = "## Epic: Replacement Epic\n- Story: Replacement Story";

        $this->service->persist($project, $firstMarkdown, $firstHash);
        $this->service->persist($project->fresh(), $secondMarkdown, $secondHash);

        $this->assertDatabaseHas('epics', ['id' => $manualEpic->id, 'title' => 'Manual Epic']);
        $this->assertDatabaseMissing('epics', ['title' => 'AI Epic', 'is_ai_generated' => true]);
        $this->assertDatabaseHas('epics', [
            'title' => 'Replacement Epic',
            'is_ai_generated' => true,
            'origin_prompt_hash' => $secondHash,
        ]);
    }

    public function test_it_rolls_back_transaction_on_failure(): void
    {
        $project = Project::factory()->create();
        $invalidMarkdown = "## Epic: Invalid\n- ";

        $mockValidator = $this->createMock(ValidateBlueprintDataAction::class);
        $mockValidator->method('__invoke')->willThrowException(new \RuntimeException('Validation failed'));

        $serviceWithMock = new BlueprintPersistenceService(
            $mockValidator,
            new BlueprintMarkdownParser(),
            new SanitiseBlueprintDataAction()
        );

        try {
            $serviceWithMock->persist($project, $invalidMarkdown, sha1('prompt-failure'));
        } catch (\RuntimeException $e) {
            // Expected
        }

        $this->assertDatabaseCount('epics', 0);
        $this->assertDatabaseCount('user_stories', 0);
    }

    public function test_it_rolls_back_transaction_on_database_exception(): void
    {
        Schema::table('epics', function (Blueprint $table) {
            $table->unique('title', 'epics_title_unique_test');
        });

        $project = Project::factory()->create();
        $project->epics()->create([
            'title' => 'Duplicate Epic',
            'position' => 10,
            'is_ai_generated' => false,
        ]);

        $markdown = "## Epic: Duplicate Epic\n- Story: Should Fail";

        try {
            $this->service->persist($project, $markdown, sha1('prompt-db-failure'));
            $this->fail('Expected QueryException to be thrown');
        } catch (QueryException $e) {
            $this->assertStringContainsString('epics_title_unique_test', $e->getMessage());
        } finally {
            Schema::table('epics', function (Blueprint $table) {
                $table->dropUnique('epics_title_unique_test');
            });
        }

        $this->assertSame(1, $project->fresh()->epics()->count()); // only manual epic remains
        $this->assertDatabaseCount('user_stories', 0);
        $this->assertDatabaseCount('schema_suggestions', 0);
    }

    public function test_it_records_empty_schema_with_telemetry_when_validation_drops_schema(): void
    {
        $project = Project::factory()->create();
        $promptHash = sha1('prompt-schema-drop');

        $validatorMock = $this->createMock(ValidateBlueprintDataAction::class);
        $validatorMock
            ->method('__invoke')
            ->willReturnCallback(function (array $data) {
                if (!empty($data['schema_suggestions'])) {
                    throw ValidationException::withMessages([
                        'schema_suggestions.0.columns.0' => ['Invalid column'],
                    ]);
                }

                return $data;
            });

        $service = new BlueprintPersistenceService(
            $validatorMock,
            new BlueprintMarkdownParser(),
            new SanitiseBlueprintDataAction()
        );

        $markdown = <<<MD
        ## Epic: Sample
        - Story: Valid Story

        ### Database Schema Suggestions
        users: id:int, invalid<> column
        MD;

        $service->persist($project, $markdown, $promptHash);

        $schemaSuggestion = $project->fresh()->schemaSuggestions()->latest()->first();
        $this->assertNotNull($schemaSuggestion);

        $parsed = $schemaSuggestion->parsed;
        $this->assertIsArray($parsed['schemas']);
        $this->assertCount(0, $parsed['schemas']);
        $this->assertTrue($parsed['telemetry']['schema_dropped']);
        $this->assertSame(
            'markdown_fallback',
            $parsed['telemetry']['parse_mode']
        );
    }

    public function test_it_merges_duplicate_schema_suggestions(): void
    {
        $project = Project::factory()->create();
        $promptHash = sha1('prompt-merge-schemas');
        $markdown = <<<MD
        ## Epic: Product
        - Story: Initial story

        ### Database Schema Suggestions
        users: id:int, name:varchar(255)
        users: email varchar unique, created_at timestamp
        MD;

        $parser = new BlueprintMarkdownParser();
        $parsedData = $parser->parse($markdown);
        ['data' => $sanitisedData] = (new SanitiseBlueprintDataAction())($parsedData);
        $this->assertNotEmpty($sanitisedData['schema_suggestions']);
        $validatedData = (new ValidateBlueprintDataAction())($sanitisedData);
        $this->assertNotEmpty($validatedData['schema_suggestions']);

        $this->service->persist($project, $markdown, $promptHash);

        $schemaSuggestion = $project->fresh()->schemaSuggestions()->latest()->first();
        $this->assertNotNull($schemaSuggestion);

        $parsed = $schemaSuggestion->parsed;
        $schemas = array_values($parsed['schemas'] ?? []);
        $this->assertCount(1, $schemas);
        $this->assertEquals(
            [
                'id int',
                'name varchar(255)',
                'email varchar unique',
                'created_at timestamp',
            ],
            $schemas[0]['columns']
        );

        $warnings = $parsed['telemetry']['warnings'] ?? [];
        $this->assertGreaterThanOrEqual(1, $warnings['dedup_schemas'] ?? 0);
        $this->assertSame(0, $warnings['trimmed_schema_columns'] ?? 0);
    }

    public function test_it_respects_schema_telemetry_feature_flag(): void
    {
        config()->set('blueprint.features.schema_telemetry', false);

        $project = Project::factory()->create();
        $promptHash = sha1('prompt-feature-flag');
        $markdown = <<<MD
        ## Epic: Flag Test
        - Story: Sample story

        ### Database Schema Suggestions
        users: id int, email varchar
        MD;

        $this->service->persist($project, $markdown, $promptHash);

        $schemaSuggestion = $project->fresh()->schemaSuggestions()->latest()->first();
        $this->assertNotNull($schemaSuggestion);

        $parsed = $schemaSuggestion->parsed;
        $this->assertArrayHasKey('schemas', $parsed);
        $this->assertArrayNotHasKey('telemetry', $parsed);

        config()->set('blueprint.features.schema_telemetry', true);
    }
}
