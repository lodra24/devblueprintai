/**
 * Centralized React Query key factory to keep cache keys consistent.
 */
const project = (projectId: string) => ["project", projectId] as const;
const projectPending = () => ["project", "pending"] as const;
const myProjects = (page: number, perPage: number) =>
    ["projects", "mine", page, perPage] as const;

export const qk = {
    project,
    projectPending,
    myProjects,
    epics: (projectId: string) => ["epics", projectId] as const,
    stories: (epicId: string) => ["stories", epicId] as const,
    projects: {
        detail: project,
        pending: projectPending,
        listing: myProjects,
    },
};
