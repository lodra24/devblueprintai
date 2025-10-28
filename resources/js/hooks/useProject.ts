// Dosya: resources/js/hooks/useProject.ts

import {
    useQuery,
    UseQueryResult,
    keepPreviousData,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { getProject } from "@/api";
import { qk } from "@/lib/queryKeys";
import { Project } from "@/types";

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
        placeholderData: keepPreviousData,
    });
};
