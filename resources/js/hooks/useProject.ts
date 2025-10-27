import {
    useQuery,
    UseQueryResult,
    keepPreviousData,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { getProject } from "@/api";
import { qk } from "@/lib/queryKeys";
import { Project, ProjectStatus } from "@/types";

const POLLING_INTERVAL_MS = 5000;

const shouldPollStatus = (status?: ProjectStatus): boolean => {
    if (!status) return false;
    return ["generating", "parsing"].includes(status);
};

export const useProject = (
    projectId?: string
): UseQueryResult<Project, AxiosError> => {
    return useQuery<Project, AxiosError>({
        queryKey: projectId ? qk.project(projectId) : qk.projectPending(),
        queryFn: async () => {
            if (!projectId) {
                throw new Error("projectId is required");
            }
            return getProject(projectId);
        },
        enabled: !!projectId,
        refetchInterval: (query) => {
            const project = query.state.data;
            return project && shouldPollStatus(project.status)
                ? POLLING_INTERVAL_MS
                : false;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        placeholderData: keepPreviousData,
    });
};
