import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
    deleteProject as deleteProjectRequest,
    updateProjectName,
} from "@/api";
import { useToast } from "@/contexts/ToastContext";
import { qk } from "@/lib/queryKeys";
import { Project } from "@/types";

const PROJECT_LIST_KEY = ["projects", "mine"] as const;

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
        const maybeMessage =
            error.response?.data &&
            typeof error.response.data === "object" &&
            error.response.data !== null &&
            "message" in error.response.data
                ? (error.response.data as { message?: string }).message
                : undefined;
        if (maybeMessage) {
            return maybeMessage;
        }
        if (typeof error.message === "string" && error.message.length > 0) {
            return error.message;
        }
    }
    if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
    ) {
        return (error as { message: string }).message;
    }
    return fallback;
};

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
        onError: (error) => {
            showToast({
                type: "error",
                message: getErrorMessage(error, "Unable to rename project."),
            });
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
        onError: (error) => {
            showToast({
                type: "error",
                message: getErrorMessage(error, "Unable to delete project."),
            });
        },
    });

    return {
        renameProject: renameMutation.mutateAsync,
        isRenaming: renameMutation.isPending,
        deleteProject: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
}
