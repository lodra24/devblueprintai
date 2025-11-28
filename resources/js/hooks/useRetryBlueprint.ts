import { useMutation, useQueryClient } from "@tanstack/react-query";
import { retryBlueprintGeneration } from "@/api";
import { qk } from "@/lib/queryKeys";
import { Project } from "@/types";
import { useToast } from "@/contexts/ToastContext";

type RetryContext = {
    previousProject?: Project;
};

export const useRetryBlueprint = (projectId?: string) => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const mutation = useMutation<void, Error, void, RetryContext>({
        mutationFn: async () => {
            if (!projectId) {
                throw new Error("projectId is required to retry the blueprint");
            }

            await retryBlueprintGeneration(projectId);
        },
        onMutate: async () => {
            if (!projectId) {
                return {};
            }

            const queryKey = qk.project(projectId);
            await queryClient.cancelQueries({ queryKey });

            const previousProject =
                queryClient.getQueryData<Project>(queryKey);

            if (previousProject) {
                queryClient.setQueryData<Project>(queryKey, {
                    ...previousProject,
                    status: "pending",
                    progress: 0,
                    stage: "pending",
                    message: null,
                });
            }

            return { previousProject };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any, _variables, context) => {
            if (!projectId || !context?.previousProject) {
                const message =
                    error?.response?.data?.message || "Retry failed.";
                showToast({ type: "error", message });
                return;
            }

            queryClient.setQueryData(qk.project(projectId), context.previousProject);

            const message =
                error?.response?.data?.message || "Retry failed.";
            showToast({ type: "error", message });
        },
        onSettled: () => {
            if (!projectId) {
                return;
            }

            queryClient.invalidateQueries({ queryKey: qk.project(projectId) });
        },
    });

    const retry = () => {
        if (!projectId || mutation.isPending) {
            return;
        }

        mutation.mutate();
    };

    return {
        retry,
        isRetrying: mutation.isPending,
    };
};
