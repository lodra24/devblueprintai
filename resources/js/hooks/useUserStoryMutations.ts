import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { Project, UserStory, Epic } from "@/types";
import { http, ensureCsrf } from "@/lib/http";
import { produce } from "immer";

// --- API Fonksiyonları ---

const createUserStory = async (payload: {
    epicId: string;
    content: string;
}): Promise<UserStory> => {
    await ensureCsrf();
    const response = await http.post("/user-stories", {
        epic_id: payload.epicId,
        content: payload.content,
    });
    return response.data.data;
};

const updateUserStory = async (payload: {
    storyId: string;
    content?: string;
    priority?: UserStory["priority"];
}): Promise<UserStory> => {
    await ensureCsrf();
    const { storyId, ...data } = payload;
    const response = await http.patch(`/user-stories/${storyId}`, data);
    return response.data.data;
};

const deleteUserStory = async (storyId: string): Promise<void> => {
    await ensureCsrf();
    await http.delete(`/user-stories/${storyId}`);
};

type ReorderPayload = {
    projectId: string;
    storyId: string;
    targetEpicId: string;
    beforeStoryId: string | null;
    afterStoryId: string | null;
};

const reorderUserStory = async (payload: ReorderPayload): Promise<void> => {
    await ensureCsrf();
    const { projectId, ...data } = payload; // projectId frontend'e özel, API'ye gönderme
    await http.post("/user-stories/reorder", data);
};

const POSITION_STEP = 100;
const POSITION_START = 100;

// --- Helper Functions ---

const findStoryAndEpic = (project: Project, storyId: string) => {
    for (const epic of project.epics) {
        const storyIndex = epic.user_stories.findIndex((s) => s.id === storyId);
        if (storyIndex !== -1) {
            return { epic, story: epic.user_stories[storyIndex], storyIndex };
        }
    }
    return null;
};

const optimisticReindexEpic = (epic: Epic) => {
    let position = POSITION_START;
    epic.user_stories.forEach((story) => {
        story.position = position;
        position += POSITION_STEP;
    });
};

// --- Mutation Hooks ---

export const useCreateUserStory = (projectId: string) => {
    const queryClient = useQueryClient();
    const projectQueryKey = qk.project(projectId);

    return useMutation({
        mutationFn: createUserStory,
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: projectQueryKey });
            const previousProject =
                queryClient.getQueryData<Project>(projectQueryKey);

            if (!previousProject) return;

            const targetEpic = previousProject.epics.find(
                (e) => e.id === payload.epicId
            );
            if (!targetEpic) return;

            const optimisticStory: UserStory = {
                id: `optimistic-${Date.now()}`,
                content: payload.content,
                priority: "medium",
                position: (targetEpic.user_stories.at(-1)?.position ?? 0) + 100,
                is_ai_generated: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const optimisticProject = produce(previousProject, (draft) => {
                const epic = draft.epics.find((e) => e.id === payload.epicId);
                epic?.user_stories.push(optimisticStory);
            });

            queryClient.setQueryData(projectQueryKey, optimisticProject);
            return { previousProject };
        },
        onError: (_err, _payload, context) => {
            context?.previousProject &&
                queryClient.setQueryData(
                    projectQueryKey,
                    context.previousProject
                );
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectQueryKey });
        },
    });
};

export const useUpdateUserStory = (projectId: string) => {
    const queryClient = useQueryClient();
    const projectQueryKey = qk.project(projectId);

    return useMutation({
        mutationFn: updateUserStory,
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: projectQueryKey });
            const previousProject =
                queryClient.getQueryData<Project>(projectQueryKey);

            if (!previousProject) return;

            const optimisticProject = produce(previousProject, (draft) => {
                const storyLocation = findStoryAndEpic(draft, payload.storyId);
                if (storyLocation) {
                    const { storyId, ...rest } = payload;
                    const definedUpdates = Object.fromEntries(
                        Object.entries(rest).filter(
                            ([, value]) => value !== undefined
                        )
                    ) as Partial<UserStory>;

                    Object.assign(storyLocation.story, {
                        ...definedUpdates,
                        is_ai_generated: false,
                    });
                }
            });

            queryClient.setQueryData(projectQueryKey, optimisticProject);
            return { previousProject };
        },
        onError: (_err, _payload, context) => {
            context?.previousProject &&
                queryClient.setQueryData(
                    projectQueryKey,
                    context.previousProject
                );
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectQueryKey });
        },
    });
};

export const useDeleteUserStory = (projectId: string) => {
    const queryClient = useQueryClient();
    const projectQueryKey = qk.project(projectId);

    return useMutation({
        mutationFn: deleteUserStory,
        onMutate: async (storyId) => {
            await queryClient.cancelQueries({ queryKey: projectQueryKey });
            const previousProject =
                queryClient.getQueryData<Project>(projectQueryKey);

            if (!previousProject) return;

            const optimisticProject = produce(previousProject, (draft) => {
                const storyLocation = findStoryAndEpic(draft, storyId);
                if (storyLocation) {
                    storyLocation.epic.user_stories.splice(
                        storyLocation.storyIndex,
                        1
                    );
                }
            });

            queryClient.setQueryData(projectQueryKey, optimisticProject);
            return { previousProject };
        },
        onError: (_err, _payload, context) => {
            context?.previousProject &&
                queryClient.setQueryData(
                    projectQueryKey,
                    context.previousProject
                );
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectQueryKey });
        },
    });
};

export const useReorderUserStory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: reorderUserStory,
        onMutate: async (payload) => {
            const projectQueryKey = qk.project(payload.projectId);
            await queryClient.cancelQueries({ queryKey: projectQueryKey });
            const previousProject =
                queryClient.getQueryData<Project>(projectQueryKey);

            if (!previousProject) return;

            const optimisticProject = produce(previousProject, (draft) => {
                const sourceLocation = findStoryAndEpic(draft, payload.storyId);
                if (!sourceLocation) return;

                const [movedStory] = sourceLocation.epic.user_stories.splice(
                    sourceLocation.storyIndex,
                    1
                );
                if (!movedStory) return;

                movedStory.is_ai_generated = false;
                (movedStory as UserStory & { epic_id?: string }).epic_id =
                    payload.targetEpicId;

                const targetEpic = draft.epics.find(
                    (e) => e.id === payload.targetEpicId
                );
                if (!targetEpic) return;

                const afterStoryIndex = payload.afterStoryId
                    ? targetEpic.user_stories.findIndex(
                          (s) => s.id === payload.afterStoryId
                      )
                    : -1;
                const beforeStoryIndex = payload.beforeStoryId
                    ? targetEpic.user_stories.findIndex(
                          (s) => s.id === payload.beforeStoryId
                      )
                    : -1;

                let insertionIndex = 0;
                if (payload.afterStoryId && afterStoryIndex !== -1) {
                    insertionIndex = afterStoryIndex + 1;
                } else if (
                    payload.beforeStoryId &&
                    beforeStoryIndex !== -1
                ) {
                    insertionIndex = beforeStoryIndex;
                } else {
                    insertionIndex = 0;
                }

                targetEpic.user_stories.splice(insertionIndex, 0, movedStory);

                // Hedef epikte deterministik reindex uygula
                optimisticReindexEpic(targetEpic);

                // Kaynak ve hedef farklıysa kaynak epik için de reindex uygula
                if (sourceLocation.epic.id !== targetEpic.id) {
                    optimisticReindexEpic(sourceLocation.epic);
                }
            });

            queryClient.setQueryData(projectQueryKey, optimisticProject);
            return { previousProject, projectQueryKey };
        },
        onError: (_err, _payload, context) => {
            if (context?.previousProject && context.projectQueryKey) {
                queryClient.setQueryData(
                    context.projectQueryKey,
                    context.previousProject
                );
            }
        },
        onSettled: (_data, _error, _payload, context) => {
            if (context?.projectQueryKey) {
                void queryClient.invalidateQueries({
                    queryKey: context.projectQueryKey,
                });
            }
        },
    });
};
