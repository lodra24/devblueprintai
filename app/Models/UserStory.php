<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStory extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    /**
     * Get the epic that the user story belongs to.
     */
    public function epic(): BelongsTo
    {
        return $this->belongsTo(Epic::class);
    }
}