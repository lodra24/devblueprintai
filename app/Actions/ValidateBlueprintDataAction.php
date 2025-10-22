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
        $validator = Validator::make($data, [
            'epics' => ['present', 'array', 'max:50'],
            'epics.*.title' => ['required', 'string', 'max:255', 'distinct'],
            'epics.*.stories' => ['present', 'array', 'max:200'],
            'epics.*.stories.*.content' => ['required', 'string', 'max:1000', 'distinct'],
            'epics.*.stories.*.priority' => ['sometimes', 'string', Rule::in(['low', 'medium', 'high'])],
            'epics.*.stories.*.status' => ['sometimes', 'string', Rule::in(['todo', 'in_progress', 'done'])],

            'schema_suggestions' => ['nullable', 'array', 'max:50'],
            'schema_suggestions.*.table_name' => [
                'required_with:schema_suggestions',
                'string',
                'max:255',
                'regex:/^[A-Za-z_][A-Za-z0-9_]*$/'
            ],
            'schema_suggestions.*.columns' => ['required_with:schema_suggestions', 'array', 'min:1', 'max:100'],
            'schema_suggestions.*.columns.*' => [
                'required_with:schema_suggestions.*.columns',
                'string',
                'max:255',
                // Column name plus optional type/qualifiers e.g. "name varchar", "id bigint:pk", "email varchar unique"
                'regex:/^[a-z_][a-z0-9_]*(\s+(?:[a-z_][a-z0-9_]*(?:\(\d+\))?)(?:[:\s][a-z_][a-z0-9_]*(?:\(\d+\))?)*)?$/i'
            ],
        ]);

        return $validator->validate();
    }
}
