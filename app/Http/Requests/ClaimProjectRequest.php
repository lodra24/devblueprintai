<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClaimProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Yetkilendirme policy sınıfı tarafından yapılacağı için true kalmalı.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'project_id' => [
                'required',
                'uuid',
                'exists:projects,id', // Sadece projenin veritabanında var olup olmadığını kontrol et
            ],
        ];
    }
}