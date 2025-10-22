import { http, ensureCsrf } from "./lib/http";
import { AxiosError } from "axios";
import { Project } from "./types";

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

export const getProject = async (
    projectId: string
): Promise<Project> => {
    const response =
        await http.get<ResourceResponse<Project>>(`/projects/${projectId}`);

    return unwrapResource(response.data);
};

export const claimProject = async (projectId: string) => {
    await ensureCsrf();
    const response = await http.post("/projects/claim", {
        project_id: projectId,
    });
    return response.data;
};

export const getUser = async () => {
    try {
        const response = await http.get("/user");
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
            return null;
        }
        throw error;
    }
};

export const login = async (credentials: any) => {
    await ensureCsrf();
    const response = await http.post("/login", credentials);
    return response.data;
};

export const register = async (userData: any) => {
    await ensureCsrf();
    const response = await http.post("/register", userData);
    return response.data;
};

export const logout = async () => {
    await ensureCsrf();
    const response = await http.post("/logout");
    return response.data;
};
