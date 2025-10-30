<?php

namespace Tests\Unit\Actions;

use App\Actions\ValidateBlueprintDataAction;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ValidateBlueprintDataActionTest extends TestCase
{
    private ValidateBlueprintDataAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new ValidateBlueprintDataAction();
    }

    public function test_it_validates_correct_data_structure(): void
    {
        $validData = [
            'epics' => [
                [
                    'title' => 'User Authentication',
                    'stories' => [
                        ['content' => 'As a user, I can register.', 'priority' => 'high', 'status' => 'todo'],
                        ['content' => 'As a user, I can log in.', 'priority' => 'medium', 'status' => 'in_progress'],
                    ],
                ],
            ],
            'schema_suggestions' => [
                [
                    'table_name' => 'users',
                    'columns' => ['id bigint:pk', 'name varchar', 'email varchar unique', 'password varchar'],
                ]
            ],
        ];

        $validated = ($this->action)($validData);

        $this->assertEquals($validData, $validated);
    }

    public function test_it_throws_exception_for_missing_epics_key(): void
    {
        $this->expectException(ValidationException::class);

        $invalidData = [
            // 'epics' key is missing
        ];

        ($this->action)($invalidData);
    }

    public function test_it_throws_exception_for_missing_epic_title(): void
    {
        $this->expectException(ValidationException::class);

        $invalidData = [
            'epics' => [
                [
                    // 'title' key is missing
                    'stories' => [
                        ['content' => 'Placeholder story'],
                    ],
                ],
            ],
        ];

        ($this->action)($invalidData);
    }

    public function test_it_throws_exception_for_missing_story_content(): void
    {
        $this->expectException(ValidationException::class);

        $invalidData = [
            'epics' => [
                [
                    'title' => 'Valid Epic',
                    'stories' => [
                        [
                            // 'content' key is missing
                        ],
                    ],
                ],
            ],
        ];

        ($this->action)($invalidData);
    }

    public function test_it_rejects_duplicate_epic_titles(): void
    {
        $this->expectException(ValidationException::class);

        ($this->action)([
            'epics' => [
                ['title' => 'Duplicate', 'stories' => [['content' => 'Story A']]],
                ['title' => 'Duplicate', 'stories' => [['content' => 'Story B']]],
            ],
            'schema_suggestions' => null,
        ]);
    }

    public function test_it_rejects_invalid_schema_columns(): void
    {
        $this->expectException(ValidationException::class);

        ($this->action)([
            'epics' => [],
            'schema_suggestions' => [
                ['table_name' => 'users', 'columns' => ['id', 'description<>']],
            ],
        ]);
    }
    
    public function test_it_accepts_empty_epics_array(): void
    {
        $validData = [
            'epics' => [],
            'schema_suggestions' => [],
        ];

        $validated = ($this->action)($validData);
        $this->assertEquals($validData, $validated);
    }

    public function test_it_requires_at_least_one_story_per_epic(): void
    {
        $this->expectException(ValidationException::class);

        ($this->action)([
            'epics' => [
                [
                    'title' => 'Empty Epic',
                    'stories' => [],
                ],
            ],
            'schema_suggestions' => null,
        ]);
    }

    public function test_it_accepts_decimal_precision_in_schema_columns(): void
    {
        $validData = [
            'epics' => [],
            'schema_suggestions' => [
                [
                    'table_name' => 'transactions',
                    'columns' => ['amount decimal (10, 2)', 'tax decimal(5,2)'],
                ],
            ],
        ];

        $validated = ($this->action)($validData);
        $this->assertEquals($validData, $validated);
    }
}
