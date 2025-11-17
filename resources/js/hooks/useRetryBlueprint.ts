import { useMutation, useQueryClient } from "@tanstack/react-query";
import { retryBlueprintGeneration } from "@/api";
import { qk } from "@/lib/queryKeys";
import { Project } from "@/types";

type RetryContext = {
    previousProject?: Project;
};

export const useRetryBlueprint = (projectId?: string) => {
    const queryClient = useQueryClient();

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
        onError: (_error, _variables, context) => {
            if (!projectId || !context?.previousProject) {
                return;
            }

            queryClient.setQueryData(qk.project(projectId), context.previousProject);
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

