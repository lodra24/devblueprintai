/**
 * Centralized React Query key factory to keep cache keys consistent.
 */
export const queryKeys = {
    projects: {
        all: ["projects"] as const,
        detail: (id: string) => ["projects", "detail", id] as const,
        pending: () => ["projects", "detail", "pending"] as const,
    },
    myProjects: () => ["projects", "mine"] as const,
    epics: {
        all: ["epics"] as const,
        byProject: (projectId: string) =>
            ["epics", "byProject", projectId] as const,
    },
    stories: {
        all: ["stories"] as const,
        byEpic: (epicId: string) => ["stories", "byEpic", epicId] as const,
    },
};

export const qk = queryKeys;
