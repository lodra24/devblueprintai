<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Jobs\GenerateBlueprintJob;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;
use App\Enums\ProjectStatus;

class ProjectController extends Controller
{
    use AuthorizesRequests;

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProjectRequest $request)
    {
        $validated = $request->validated();
        $userId = Auth::id();

        $project = new Project();
        $project->name = $validated['name'];
        $project->idea_text = $validated['idea_text']; // Save idea_text
        $project->user_id = $userId;
        $project->status = ProjectStatus::Generating; // Set initial status
        $project->progress = 0; // Set initial progress
        $project->save();

        GenerateBlueprintJob::dispatch($project->id);

        return response()->json([
            'message' => 'Project creation request received. Blueprint is being generated.',
            'project_id' => $project->id,
        ], 202);
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project)
    {
        $this->authorize('view', $project);

        return response()->json($project);
    }
}
