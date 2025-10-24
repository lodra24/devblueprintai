import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys as qk } from "@/lib/queryKeys";
import { Project, Epic, UserStory } from "@/types";
import { http, ensureCsrf } from "@/lib/http";
import { produce } from "immer";

// --- API Fonksiyonları ---

const createEpic = async (payload: {
    projectId: string;
    title: string;
}): Promise<Epic> => {
    await ensureCsrf();
    const response = await http.post("/epics", {
        project_id: payload.projectId,
        title: payload.title,
    });
    return response.data.data;
};

const updateEpic = async (payload: {
    epicId: string;
    title: string;
}): Promise<Epic> => {
    await ensureCsrf();
    const { epicId, ...data } = payload;
    const response = await http.patch(`/epics/${epicId}`, data);
    return response.data.data;
};

const deleteEpic = async (epicId: string): Promise<void> => {
    await ensureCsrf();
    await http.delete(`/epics/${epicId}`);
};

// --- Mutation Hooks ---

export const useCreateEpic = (projectId: string) => {
    const queryClient = useQueryClient();
    const projectQueryKey = qk.projects.detail(projectId);

    return useMutation({
        mutationFn: createEpic,
        onMutate: async (newEpicPayload) => {
            await queryClient.cancelQueries({ queryKey: projectQueryKey });
            const previousProject =
                queryClient.getQueryData<Project>(projectQueryKey);

            if (!previousProject) {
                return;
            }

            const optimisticEpic: Epic = {
                id: `optimistic-${Date.now()}`,
                title: newEpicPayload.title,
                position: (previousProject.epics.at(-1)?.position ?? 0) + 100,
                is_ai_generated: false,
                user_stories: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const optimisticProject = produce(previousProject, (draft) => {
                draft.epics.push(optimisticEpic);
            });

            queryClient.setQueryData(projectQueryKey, optimisticProject);

            return { previousProject };
        },
        onError: (_err, _newEpic, context) => {
            if (context?.previousProject) {
                queryClient.setQueryData(
                    projectQueryKey,
                    context.previousProject
                );
            }
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectQueryKey });
        },
    });
};

export const useUpdateEpic = (projectId: string) => {
    const queryClient = useQueryClient();
    const projectQueryKey = qk.projects.detail(projectId);

    return useMutation({
        mutationFn: updateEpic,
        onMutate: async (updatedEpicPayload) => {
            await queryClient.cancelQueries({ queryKey: projectQueryKey });
            const previousProject =
                queryClient.getQueryData<Project>(projectQueryKey);

            if (!previousProject) {
                return;
            }

            const optimisticProject = produce(previousProject, (draft) => {
                const epic = draft.epics.find(
                    (e) => e.id === updatedEpicPayload.epicId
                );
                if (epic) {
                    epic.title = updatedEpicPayload.title;
                    epic.is_ai_generated = false;
                }
            });

            queryClient.setQueryData(projectQueryKey, optimisticProject);

            return { previousProject };
        },
        onError: (_err, _updatedEpic, context) => {
            if (context?.previousProject) {
                queryClient.setQueryData(
                    projectQueryKey,
                    context.previousProject
                );
            }
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectQueryKey });
        },
    });
};

export const useDeleteEpic = (projectId: string) => {
    const queryClient = useQueryClient();
    const projectQueryKey = qk.projects.detail(projectId);

    return useMutation({
        mutationFn: deleteEpic,
        onMutate: async (epicIdToDelete) => {
            await queryClient.cancelQueries({ queryKey: projectQueryKey });
            const previousProject =
                queryClient.getQueryData<Project>(projectQueryKey);

            if (!previousProject) {
                return;
            }

            const optimisticProject = produce(previousProject, (draft) => {
                draft.epics = draft.epics.filter(
                    (epic) => epic.id !== epicIdToDelete
                );
            });

            queryClient.setQueryData(projectQueryKey, optimisticProject);

            return { previousProject };
        },
        onError: (_err, _deletedEpicId, context) => {
            if (context?.previousProject) {
                queryClient.setQueryData(
                    projectQueryKey,
                    context.previousProject
                );
            }
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectQueryKey });
        },
    });
};
