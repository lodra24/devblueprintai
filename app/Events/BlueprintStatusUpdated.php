<?php

namespace App\Events;

use App\Enums\ProjectStatus;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BlueprintStatusUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly string $projectId,
        public readonly ProjectStatus $status,
        public readonly int $progress,
        public readonly ?string $stage = null,
        public readonly ?string $message = null
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('projects.'.$this->projectId),
        ];
    }

    /**
     * Provide a stable event name for frontend listeners.
     */
    public function broadcastAs(): string
    {
        return 'blueprint.status.updated';
    }

    /**
     * Limit the payload to the fields needed by the UI.
     */
    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->projectId,
            'status' => $this->status->value,
            'progress' => $this->progress,
            'stage' => $this->stage,
            'message' => $this->message,
        ];
    }
}
