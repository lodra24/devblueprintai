<?php

use App\Models\Project;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('projects.{projectId}', function ($user, string $projectId) {
    if (!$user) {
        return false;
    }

    $project = Project::find($projectId);

    if (!$project) {
        return false;
    }

    return $user->can('view', $project);
});
