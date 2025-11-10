import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    deleteProject as deleteProjectRequest,
    updateProjectName,
} from "@/api";
import { useToast } from "@/contexts/ToastContext";
import { qk } from "@/lib/queryKeys";
import { Project } from "@/types";

const PROJECT_LIST_KEY = ["projects", "mine"] as const;

export function useProjectRowMutations(projectId: string) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const renameMutation = useMutation({
        mutationFn: (name: string) =>
            updateProjectName(projectId, { name: name.trim() }),
        onSuccess: async (project) => {
            queryClient.setQueryData<Project>(
                qk.project(projectId),
                (previous) =>
                    previous
                        ? {
                              ...previous,
                              name: project.name,
                              updated_at: project.updated_at,
                          }
                        : previous
            );
            await queryClient.invalidateQueries({
                queryKey: PROJECT_LIST_KEY,
                exact: false,
            });
            showToast({ type: "success", message: "Project renamed." });
        },
        onError: () => {
            showToast({ type: "error", message: "Unable to rename project." });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteProjectRequest(projectId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: PROJECT_LIST_KEY,
                exact: false,
            });
            queryClient.removeQueries({
                queryKey: qk.project(projectId),
                exact: true,
            });
            showToast({ type: "success", message: "Project deleted." });
        },
        onError: () => {
            showToast({ type: "error", message: "Unable to delete project." });
        },
    });

    return {
        renameProject: renameMutation.mutateAsync,
        isRenaming: renameMutation.isPending,
        deleteProject: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
}
