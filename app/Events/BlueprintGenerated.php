<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BlueprintGenerated
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public Project $project,
        public string $promptHash
    ) {}
}
