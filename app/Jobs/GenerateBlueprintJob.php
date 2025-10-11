<?php

namespace App\Jobs;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateBlueprintJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The project ID.
     *
     * @var int
     */
    public string $projectId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $projectId)
    {
        $this->projectId = $projectId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Görevin hangi proje için çalıştığını bul
        $project = Project::find($this->projectId);

        if (!$project) {
            Log::error("GenerateBlueprintJob: Project with ID {$this->projectId} not found.");
            return;
        }

        // --- YAPAY ZEKA MANTIĞI GELECEKTE BURAYA EKLENECEK ---
        // Şimdilik sadece log tutarak ve durumu güncelleyerek simüle edelim
        Log::info("Generating blueprint for project: {$project->name} (ID: {$this->projectId})");
        
        // Simülasyon için 5 saniye bekletelim
        sleep(5);

        // İşlem bittiğinde projenin durumunu güncelleyelim
        $project->status = 'completed';
        $project->blueprint = ['epics' => ['// TODO: AI generated content will be here']]; // Örnek veri
        $project->save();

        Log::info("Blueprint generation completed for project ID: {$this->projectId}");
    }
}