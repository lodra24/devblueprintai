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
            'system_instruction' => <<<'TEXT'
You are an expert software project manager. Produce the project blueprint as a single JSON object only (no Markdown, no code fences, no explanations). The JSON MUST match this schema exactly:
{
  "epics": [
    {
      "title": "string (1..255)",
      "stories": [
        {
          "content": "string (1..1000)",
          "priority": "low|medium|high",
          "status": "todo|in_progress|done"
        }
      ]
    }
  ],
  "schema_suggestions": [
    {
      "table_name": "string matching ^[A-Za-z_][A-Za-z0-9_]*$",
      "columns": ["column_name[:type[:qualifier]] ..."]
    }
  ]
}
If there is no data for a section, return an empty array for that key. Do not include comments or trailing text.
TEXT,
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
            'system_instruction' => <<<'TEXT'
You are an expert software project manager. Produce the project blueprint as a single JSON object only (no Markdown, no code fences, no explanations). The JSON MUST match this schema exactly:
{
  "epics": [
    {
      "title": "string (1..255)",
      "stories": [
        {
          "content": "string (1..1000)",
          "priority": "low|medium|high",
          "status": "todo|in_progress|done"
        }
      ]
    }
  ],
  "schema_suggestions": [
    {
      "table_name": "string matching ^[A-Za-z_][A-Za-z0-9_]*$",
      "columns": ["column_name[:type[:qualifier]] ..."]
    }
  ]
}
If there is no data for a section, return an empty array for that key. Do not include comments or trailing text.
TEXT,
            'generation_config' => [
                'temperature' => (float) env('AI_TEMPERATURE', 0.4),
                'maxOutputTokens' => (int) env('AI_MAX_OUTPUT_TOKENS', 8192),
                'response_mime_type' => 'application/json',
            ],
        ],
    ],
];
