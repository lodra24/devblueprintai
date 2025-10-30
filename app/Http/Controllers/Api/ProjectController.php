<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\ProjectSummaryResource;
use App\Jobs\GenerateBlueprintJob;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
        $project->idea_text = $validated['idea_text'];
        $project->user_id = $userId;
        $project->status = ProjectStatus::Generating;
        $project->progress = 0;
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

        // Eager-load nested relationships to prevent N+1 query issues.
        $project->load(['epics.userStories', 'schemaSuggestions']);

        return new ProjectResource($project);
    }

    /**
     * Display a listing of the user's projects.
     */
    public function myProjects(Request $request)
    {
        $perPage = max(1, min(50, (int) $request->integer('per_page', 10)));
        $page = max(1, (int) $request->integer('page', 1));

        $projects = $request->user()
            ->projects()
            ->select(['id', 'name', 'status', 'progress', 'created_at', 'updated_at'])
            ->latest('updated_at')
            ->paginate(perPage: $perPage, page: $page);

        return ProjectSummaryResource::collection($projects);
    }
}
