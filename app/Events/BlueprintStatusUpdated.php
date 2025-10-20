<?php

namespace App\Events;

use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BlueprintStatusUpdated
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public Project $project,
        public ProjectStatus $status,
        public int $progress,
        public ?string $stage = null,
        public ?string $message = null
    ) {}
}
