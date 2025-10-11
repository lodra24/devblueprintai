<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule; // Bu satırı ekliyoruz

class ClaimProjectController extends Controller
{
    use AuthorizesRequests;

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {

        $validated = $request->validate([
            'project_id' => [
                'required',
                'string', // UUID bir string'dir.
                Rule::exists('projects', 'id')->where('user_id', null),
            ],
        ]);

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