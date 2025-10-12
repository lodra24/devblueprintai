<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Since authorization is handled by the Policy classes, we leave this as true.
        // If it remains false, all requests will receive a 403 Forbidden error.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = Auth::id();

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'prompt' => ['required', 'string', 'max:5000'],
        ];

        if ($userId) {
            $rules['name'][] = Rule::unique('projects')->where('user_id', '!=', null)->where('user_id', $userId);
        }

        return $rules;
    }
}