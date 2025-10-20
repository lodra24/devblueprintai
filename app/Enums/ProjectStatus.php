<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Pending = 'pending';
    case Generating = 'generating';
    case Parsing = 'parsing';
    case Ready = 'ready';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Generating => 'Generating',
            self::Parsing => 'Parsing',
            self::Ready => 'Ready',
            self::Failed => 'Failed',
        };
    }
}
