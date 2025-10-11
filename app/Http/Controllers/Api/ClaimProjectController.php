<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClaimProjectController extends Controller
{
    use AuthorizesRequests;

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
        ]);

        $project = DB::transaction(function () use ($validated, $request) {

            // Projeyi bul ve diğer işlemlerin değiştirmemesi için kilitle
            $project = Project::where('id', $validated['project_id'])
                ->lockForUpdate()
                ->firstOrFail();

            // Eğer user_id null değilse, policy false döner ve 409 Forbidden hatası otomatik fırlatılır.
            $this->authorize('claim', $project);

            // Projeyi istek atan kullanıcıya ata
            $project->user_id = $request->user()->id;
            $project->save();

            return $project;
        });

        // Yanıtı, güncellenmiş proje verisiyle zenginleştirdik.
        return response()->json([
            'message' => 'Project successfully claimed.',
            'project' => $project,
        ], 200); // Başarılı olduğu için 200 OK
    }
}