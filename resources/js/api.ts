import { http, ensureCsrf } from "./lib/http";
import { AxiosError } from "axios";

// The 'data' parameter type is now updated to expect 'idea_text' instead of 'prompt'.
export const createProject = async (data: {
    name: string;
    idea_text: string;
}) => {
    await ensureCsrf();
    const response = await http.post("/projects", data);
    return response.data;
};

export const getProject = async (projectId: string) => {
    const response = await http.get(`/projects/${projectId}`);
    return response.data;
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
