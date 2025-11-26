import { Project, ProjectStatus } from "@/types";

export type BlueprintStatusEvent = {
    project_id: string;
    status: ProjectStatus;
    progress: number;
    stage?: string | null;
    message?: string | null;
};

export const applyBlueprintStatusEvent = (
    previous: Project,
    event: BlueprintStatusEvent
): Project => {
    const nextStatus = event.status;
    const incomingProgress = event.progress ?? previous.progress ?? 0;
    const nextProgress = Math.max(previous.progress ?? 0, incomingProgress);
    const nextStage =
        event.stage ??
        (nextStatus === "ready" || nextStatus === "failed"
            ? nextStatus
            : previous.stage ?? nextStatus);

    let nextMessage =
        previous.message && nextStatus === "failed" ? previous.message : null;

    if (event.status === "failed") {
        nextMessage = event.message ?? previous.message ?? null;
    } else if (event.message !== undefined) {
        nextMessage = event.message;
    }

    const didChange =
        previous.status !== nextStatus ||
        previous.progress !== nextProgress ||
        previous.stage !== nextStage ||
        previous.message !== nextMessage;

    if (!didChange) {
        return previous;
    }

    return {
        ...previous,
        status: nextStatus,
        progress: nextProgress,
        stage: nextStage,
        message: nextMessage,
    };
};
