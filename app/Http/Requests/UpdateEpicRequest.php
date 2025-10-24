<?php

namespace App\Http\Requests;

use App\Models\Epic;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEpicRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // The user can update an epic if they can update the parent project.
        // The 'epic' model is injected via route model binding.
        /** @var Epic $epic */
        $epic = $this->route('epic');

        return $this->user()->can('update', $epic->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Epic $epic */
        $epic = $this->route('epic');
        
        return [
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                // Title must be unique within the same project, ignoring the current epic.
                Rule::unique('epics')->where('project_id', $epic->project_id)->ignore($epic->id),
            ],
        ];
    }
}