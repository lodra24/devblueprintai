import { http, ensureCsrf } from "./lib/http";
import { AxiosError } from "axios";
import { Paginated, Project, ProjectSummary, UserStory } from "./types";

export interface AuthUser {
    id: number;
    name: string;
    email: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface LoginPayload {
    email: string;
    password: string;
    remember?: boolean;
}

type ResourceResponse<T> = {
    data: T;
};

const unwrapResource = <T>(payload: ResourceResponse<T> | T): T => {
    if (payload !== null && typeof payload === "object" && "data" in payload) {
        return (payload as ResourceResponse<T>).data;
    }

    return payload as T;
};

export const createProject = async (data: {
    name: string;
    idea_text: string;
}) => {
    await ensureCsrf();
    const response = await http.post("/projects", data);
    return response.data;
};

export const getProject = async (projectId: string): Promise<Project> => {
    const response = await http.get<ResourceResponse<Project>>(
        `/projects/${projectId}`
    );

    return unwrapResource(response.data);
};

export const updateProjectName = async (
    projectId: string,
    data: { name: string }
): Promise<Project> => {
    await ensureCsrf();
    const response = await http.patch<ResourceResponse<Project>>(
        `/projects/${projectId}`,
        data
    );
    return unwrapResource(response.data);
};

export const deleteProject = async (projectId: string): Promise<void> => {
    await ensureCsrf();
    await http.delete(`/projects/${projectId}`);
};

type GetMyProjectsOptions = {
    page?: number;
    perPage?: number;
};

export const getMyProjects = async (
    options: GetMyProjectsOptions = {}
): Promise<Paginated<ProjectSummary[]>> => {
    const { page = 1, perPage = 10 } = options;
    const response = await http.get<Paginated<ProjectSummary[]>>(
        "/my-projects",
        {
            params: {
                page,
                per_page: perPage,
            },
        }
    );
    return response.data;
};

export const claimProject = async (projectId: string) => {
    await ensureCsrf();
    const response = await http.post("/projects/claim", {
        project_id: projectId,
    });
    return response.data;
};

export const retryBlueprintGeneration = async (projectId: string) => {
    await ensureCsrf();
    const response = await http.post(`/projects/${projectId}/retry`);
    return response.data;
};

export const getUser = async (): Promise<AuthUser | null> => {
    try {
        const response = await http.get<ResourceResponse<AuthUser> | AuthUser>(
            "/user"
        );
        return unwrapResource(response.data);
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
            return null;
        }
        throw error;
    }
};

export const login = async (
    credentials: LoginPayload
): Promise<void> => {
    await ensureCsrf();
    await http.post("/login", credentials);
};

export const register = async (
    userData: RegisterPayload
): Promise<void> => {
    await ensureCsrf();
    await http.post("/register", userData);
};

export const logout = async (): Promise<void> => {
    await ensureCsrf();
    await http.post("/logout");
};

export const generateStoryForEpic = async (
    epicId: string
): Promise<UserStory> => {
    await ensureCsrf();
    const response = await http.post<ResourceResponse<UserStory>>(
        `/epics/${epicId}/generate-story`
    );

    return unwrapResource(response.data);
};
