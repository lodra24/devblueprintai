<?php

namespace App\Http\Requests;

use App\Models\UserStory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserStoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var UserStory $user_story */
        $user_story = $this->route('user_story');

        // The user can update a story if they can update the parent project.
        return $this->user()->can('update', $user_story->epic->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => ['sometimes', 'required', 'string', 'max:1000'],
            'status' => ['sometimes', 'string', Rule::in(['todo', 'in_progress', 'done'])],
            'priority' => ['sometimes', 'string', Rule::in(['low', 'medium', 'high'])],
        ];
    }
}