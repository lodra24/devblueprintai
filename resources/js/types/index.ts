export type ProjectStatus =
    | "pending"
    | "generating"
    | "parsing"
    | "ready"
    | "failed";

export interface Project {
    id: string;
    user_id: number | null;
    name: string;
    idea_text: string | null;
    blueprint: unknown | null;
    status: ProjectStatus;
    progress: number;
    claimed_at: string | null;
    created_at: string;
    updated_at: string;
}
