<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateBlueprintJob;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    use AuthorizesRequests;

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        
        $userId = Auth::id();

        
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'prompt' => ['required', 'string', 'max:5000'],
        ];

        
        if ($userId) {
            $rules['name'][] = Rule::unique('projects')->where('user_id', $userId);
        }

        
        $validated = $request->validate($rules);

        
        $project = new Project();
        $project->name = $validated['name'];
        $project->prompt = $validated['prompt'];
        $project->user_id = $userId; 
        $project->save();

        // After the project is saved, start the job.
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