import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createProject } from "@/api";
import { GUEST_PROJECT_ID_KEY } from "@/constants";
import { routeUrls } from "@/routes";

// Type updated from 'prompt' to 'idea_text'
type CreateProjectPayload = {
    name: string;
    idea_text: string;
};

export const useCreateProject = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (newProject: CreateProjectPayload) =>
            createProject(newProject),
        onSuccess: (data) => {
            if (data.project_id) {
                const projectId = data.project_id;
                localStorage.setItem(GUEST_PROJECT_ID_KEY, projectId);
                navigate(routeUrls.blueprint(projectId));
            }
        },
        onError: (error) => {
            console.error("Project creation mutation failed:", error);
        },
    });
};
