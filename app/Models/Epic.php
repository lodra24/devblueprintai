<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Epic extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    /**
     * Get the project that the epic belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user stories for the epic.
     */
    public function userStories(): HasMany
    {
        return $this->hasMany(UserStory::class)->orderBy('position');
    }
}