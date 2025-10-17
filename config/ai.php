<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Service Configuration
    |--------------------------------------------------------------------------
    |
    | This file is for storing the configuration for third-party AI services
    | like Google, OpenAI, etc. This allows you to easily switch
    | between providers or update API keys and models centrally.
    |
    */

    'provider' => env('AI_PROVIDER', 'google'), // Default provider is now Google

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        'timeout' => env('AI_REQUEST_TIMEOUT', 120),
        'defaults' => [
            'system_instruction' => "You are an expert software project manager. Based on the user's idea, generate a comprehensive project blueprint. The output must be a single block of raw Markdown. The blueprint should contain 'Epics' and under each epic, 'User Stories'. Also include a section for 'Database Schema Suggestions'.",
            'generation_config' => [
                'temperature' => (float) env('AI_TEMPERATURE', 0.4),
                'max_tokens' => (int) env('AI_MAX_OUTPUT_TOKENS', 4096),
            ],
        ],
    ],

    'google' => [
        'api_key' => env('GOOGLE_API_KEY'),
        'model' => env('GOOGLE_MODEL', 'gemini-2.5-pro'),
        'base_url' => 'https://generativelanguage.googleapis.com/' . env('GOOGLE_API_VERSION', 'v1beta') . '/models',
        'timeout' => env('AI_REQUEST_TIMEOUT', 120),
        'defaults' => [
            'system_instruction' => "You are an expert software project manager. Based on the user's idea, generate a comprehensive project blueprint. The output must be a single block of raw Markdown. The blueprint should contain 'Epics' and under each epic, 'User Stories'. Also include a section for 'Database Schema Suggestions'.",
            'generation_config' => [
                'temperature' => (float) env('AI_TEMPERATURE', 0.4),
                'maxOutputTokens' => (int) env('AI_MAX_OUTPUT_TOKENS', 8192),
            ],
        ],
    ],
];