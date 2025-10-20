<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Project extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'blueprint' => 'array',
            'status' => ProjectStatus::class,
            'progress' => 'integer', // Added integer cast for progress
            'claimed_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the project.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the epics for the project.
     */
    public function epics(): HasMany
    {
        return $this->hasMany(Epic::class)->orderBy('position');
    }

    /**
     * Get the schema suggestions generated for the project.
     */
    public function schemaSuggestions(): HasMany
    {
        return $this->hasMany(SchemaSuggestion::class)->latest();
    }

    /**
     * Get the AI runs for the project.
     */
    public function aiRuns(): HasMany
    {
        return $this->hasMany(AiRun::class);
    }

    /**
     * Convenience relation to fetch all user stories through epics.
     */
    public function userStories(): HasManyThrough
    {
        return $this->hasManyThrough(UserStory::class, Epic::class)
            ->select('user_stories.*')
            ->orderBy('user_stories.position');
    }
}
