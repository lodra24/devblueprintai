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
import { BLUEPRINT_POLLING_INTERVAL_MS } from "@/constants";
import Echo from "@/lib/echo";
import { qk } from "@/lib/queryKeys";
import {
    applyBlueprintStatusEvent,
    BlueprintStatusEvent,
} from "@/lib/blueprintUtils";

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
                ? BLUEPRINT_POLLING_INTERVAL_MS
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
                    (previous) =>
                        previous
                            ? applyBlueprintStatusEvent(previous, event)
                            : previous
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
