<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest; 
use App\Jobs\GenerateBlueprintJob;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
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
        $project->prompt = $validated['prompt'];
        $project->user_id = $userId;
        $project->save();

        if (!$userId) {
            $guestProjectIds = $request->session()->get('guest_project_ids', []);
            $guestProjectIds[] = $project->id;
            $request->session()->put('guest_project_ids', $guestProjectIds);
        }

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