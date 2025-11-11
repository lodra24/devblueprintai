<?php

namespace App\Actions;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class ValidateBlueprintDataAction
{
    /**
     * Validate the parsed blueprint data structure.
     *
     * @param array $data The parsed data from markdown.
     * @return array The validated data.
     * @throws ValidationException
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

        $validator = Validator::make($data, [
            'epics' => ['present', 'array', 'max:' . $maxEpics],
            'epics.*.title' => ['required', 'string', 'max:' . $maxTitle, 'distinct'],
            'epics.*.stories' => ['present', 'array', 'min:1', 'max:' . $maxStories],
            'epics.*.stories.*.content' => ['required', 'string', 'max:' . $maxStory],
            'epics.*.stories.*.priority' => ['sometimes', 'string', Rule::in(['low', 'medium', 'high'])],

            'schema_suggestions' => ['nullable', 'array', 'max:' . $maxSchemas],
            'schema_suggestions.*.table_name' => [
                'required_with:schema_suggestions',
                'string',
                'max:' . $maxTitle,
                'regex:/^[A-Za-z_][A-Za-z0-9_]*$/'
            ],
            'schema_suggestions.*.columns' => ['required_with:schema_suggestions', 'array', 'min:1', 'max:' . $maxColumns],
            'schema_suggestions.*.columns.*' => [
                'required_with:schema_suggestions.*.columns',
                'string',
                'max:' . $maxColumnToken,
                // Column name plus optional type/qualifiers e.g. "name varchar", "id bigint:pk", "email varchar unique"
                'regex:/^[a-z_][a-z0-9_]*(?:[:\s]+[a-z_][a-z0-9_]*(?:\s*\(\s*[a-z0-9_,\s]*\s*\))?)*$/i'
            ],
        ]);

        return $validator->validate();
    }
}
