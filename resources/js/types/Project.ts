import { Epic } from "./Epic";

export type ProjectStatus =
    | "pending"
    | "generating"
    | "parsing"
    | "ready"
    | "failed";

export interface Project {
    id: string;
    name: string;
    idea_text: string | null;
    status: ProjectStatus;
    progress: number;
    epics: Epic[];
    created_at: string;
    updated_at: string;
}
