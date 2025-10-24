<?php

namespace App\Http\Requests;

use App\Models\Epic;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserStoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // The user can create a story if they can update the parent epic's project.
        $epic = Epic::find($this->input('epic_id'));

        return $epic && $this->user()->can('update', $epic->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'epic_id' => ['required', 'uuid', 'exists:epics,id'],
            'content' => ['required', 'string', 'max:1000'],
        ];
    }
}