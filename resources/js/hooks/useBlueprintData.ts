// Dosya: resources/js/hooks/useBlueprintData.ts

import { useEffect, useRef } from "react";
import {
    useQuery,
    useQueryClient,
    UseQueryResult,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Project, ProjectStatus } from "@/types";
import { getProject } from "@/api";
import Echo from "@/lib/echo";
import { qk } from "@/lib/queryKeys";

const POLLING_INTERVAL_MS = 5000;

type BlueprintStatusEvent = {
    project_id: string;
    status: ProjectStatus;
    progress: number;
    stage?: string | null;
    message?: string | null;
};

const shouldPollStatus = (status?: ProjectStatus): boolean => {
    if (!status) return false;
    return ["generating", "parsing"].includes(status);
};

export const useBlueprintData = (
    projectId: string | undefined
): UseQueryResult<Project, AxiosError> => {
    const queryClient = useQueryClient();
    const wsLiveRef = useRef(false);

    const queryKey = projectId ? qk.project(projectId) : qk.projectPending();

    const queryResult = useQuery<Project, AxiosError, Project, typeof queryKey>({
        queryKey,
        queryFn: async () => {
            if (!projectId) {
                throw new Error("projectId is required");
            }
            return getProject(projectId);
        },
        enabled: !!projectId,
        ...(projectId
            ? {
                  onSuccess: (fetchedProject: Project) => {
                      queryClient.setQueryData<Project | undefined>(
                          qk.project(projectId),
                          (previous) => {
                              const stage =
                                  fetchedProject.status === "ready"
                                      ? "ready"
                                      : fetchedProject.status === "failed"
                                      ? previous?.stage ?? "failed"
                                      : fetchedProject.status;

                              const message =
                                  fetchedProject.status === "failed"
                                      ? previous?.message ?? null
                                      : null;

                              return {
                                  ...fetchedProject,
                                  stage,
                                  message,
                              };
                          }
                      );
                  },
              }
            : {}),
        refetchInterval: (query) => {
            if (wsLiveRef.current) {
                return false;
            }

            const project = query.state.data;
            return project && shouldPollStatus(project.status)
                ? POLLING_INTERVAL_MS
                : false;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    useEffect(() => {
        if (!projectId) {
            return;
        }

        const channelName = `projects.${projectId}`;
        const eventName = "blueprint.status.updated";

        try {
            const channel = Echo.private(channelName);

            const listener = (event: BlueprintStatusEvent) => {
                console.log("WebSocket event received:", event);

                wsLiveRef.current = true;

                queryClient.setQueryData<Project | undefined>(
                    qk.project(projectId),
                    (previous) => {
                        if (!previous) {
                            return previous;
                        }

                        const nextStatus = event.status;
                        const incomingProgress =
                            event.progress ?? previous.progress ?? 0;
                        const nextProgress = Math.max(
                            previous.progress ?? 0,
                            incomingProgress
                        );
                        const nextStage =
                            event.stage ??
                            (nextStatus === "ready" || nextStatus === "failed"
                                ? nextStatus
                                : previous.stage ?? nextStatus);

                        let nextMessage =
                            previous.message && nextStatus === "failed"
                                ? previous.message
                                : null;

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
                    }
                );

                if (
                    event.status === "ready" ||
                    event.status === "failed"
                ) {
                    queryClient.invalidateQueries({
                        queryKey: qk.project(projectId),
                    });
                }
            };

            channel.listen(eventName, listener);

            return () => {
                wsLiveRef.current = false;
                channel.stopListening(eventName);
                Echo.leave(channelName);
            };
        } catch (error) {
            console.error("Failed to subscribe to WebSocket channel:", error);
        }
    }, [projectId, queryClient]);

    return queryResult;
};
