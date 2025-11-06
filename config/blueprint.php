<?php

return [
    'limits' => [
        'epics' => env('BLUEPRINT_LIMIT_EPICS', 50),
        'stories_per_epic' => env('BLUEPRINT_LIMIT_STORIES_PER_EPIC', 200),
        'schemas' => env('BLUEPRINT_LIMIT_SCHEMAS', 50),
        'columns_per_table' => env('BLUEPRINT_LIMIT_COLUMNS_PER_TABLE', 100),
        'title_max' => env('BLUEPRINT_LIMIT_TITLE_MAX', 255),
        'story_max' => env('BLUEPRINT_LIMIT_STORY_MAX', 1000),
        'column_token_max' => env('BLUEPRINT_LIMIT_COLUMN_TOKEN_MAX', 255),
    ],
    'ad_limits' => [
        'hook' => 60,
        'google_h1' => 30,
        'google_desc' => 90,
        'meta_primary' => 125,
        'lp_h1' => 60,
        'email_subject' => 60,
    ],
    'features' => [
        'schema_telemetry' => env('BLUEPRINT_SCHEMA_TELEMETRY_ENABLED', true),
        'ui_v2' => env('VITE_UI_V2', true),
    ],
];
