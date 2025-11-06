import type { DerivedFields } from "./DerivedFields";

export interface UserStory {
    id: string;
    content: string;
    status: "todo" | "in_progress" | "done";
    priority: "low" | "medium" | "high";
    position: number;
    is_ai_generated: boolean;
    created_at: string;
    updated_at: string;
    derived_fields?: DerivedFields;
}
