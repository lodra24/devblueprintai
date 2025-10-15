import { useQuery } from "@tanstack/react-query";
import { getProject } from "../api";
import { qk } from "../lib/queryKeys";

// Proje verilerini çekmek için custom hook
export const useProject = (projectId?: string) => {
    return useQuery({
        queryKey: projectId
            ? qk.projects.detail(projectId)
            : (["projects", "detail", "pending"] as const),
        queryFn: async () => {
            if (!projectId) {
                throw new Error("projectId is required");
            }
            return getProject(projectId);
        },
        enabled: !!projectId,
    });
};
