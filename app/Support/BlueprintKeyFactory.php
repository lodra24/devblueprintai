<?php

namespace App\Support;

use Illuminate\Support\Str;

class BlueprintKeyFactory
{
    public static function epic(string $title): string
    {
        $title = trim($title);

        return Str::slug($title) ?: sha1($title);
    }

    public static function story(string $content): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim($content));

        return Str::slug($normalized) ?: sha1($normalized);
    }
}

