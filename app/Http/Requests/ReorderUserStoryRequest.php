<?php

namespace App\Http\Requests;

use App\Models\Epic;
use App\Models\UserStory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderUserStoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $story = UserStory::find($this->input('storyId'));
        $targetEpic = Epic::find($this->input('targetEpicId'));

        if (!$story || !$targetEpic) {
            return false;
        }

        // Ensure both the story's original epic and the target epic belong to the same project.
        if ($story->epic->project_id !== $targetEpic->project_id) {
            return false;
        }

        // The user can reorder if they can update the project.
        return $this->user()->can('update', $story->epic->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $targetEpicId = (string) $this->input('targetEpicId');

        return [
            'storyId' => ['required', 'uuid', 'exists:user_stories,id'],
            'targetEpicId' => ['required', 'uuid', 'exists:epics,id'],
            'beforeStoryId' => [
                'nullable',
                'uuid',
                'different:storyId',
                Rule::exists('user_stories', 'id')->where('epic_id', $targetEpicId),
            ],
            'afterStoryId' => [
                'nullable',
                'uuid',
                'different:storyId',
                'different:beforeStoryId',
                Rule::exists('user_stories', 'id')->where('epic_id', $targetEpicId),
            ],
        ];
    }
}
