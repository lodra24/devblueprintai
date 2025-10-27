import { ProjectStatus } from "./Project";

export interface ProjectSummary {
    id: string;
    name: string;
    status: ProjectStatus;
    progress: number;
    created_at: string;
    updated_at: string;
}
