<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $project = $this->route('project');
        $projectId = $project?->id;
        $userId = $this->user()?->id;

        $uniqueRule = Rule::unique('projects');

        if ($userId) {
            $uniqueRule = $uniqueRule->where(fn ($query) => $query->where('user_id', $userId));
        }

        if ($projectId) {
            $uniqueRule = $uniqueRule->ignore($projectId);
        }

        return [
            'name' => ['required', 'string', 'max:255', $uniqueRule],
        ];
    }
}
