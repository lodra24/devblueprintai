<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClaimProjectRequest;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

// Artık Request ve Rule'a burada ihtiyacımız yok.

class ClaimProjectController extends Controller
{
    use AuthorizesRequests;

    /**
     * Handle the incoming request.
     */
    public function __invoke(ClaimProjectRequest $request): JsonResponse 
    {
        $validated = $request->validated(); 

        $project = DB::transaction(function () use ($validated, $request) {
            $project = Project::where('id', $validated['project_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $this->authorize('claim', $project);

            $project->user_id = $request->user()->id;
            $project->save();

            return $project;
        });

        return response()->json([
            'message' => 'Project successfully claimed.',
            'project' => $project,
        ], 200);
    }
}