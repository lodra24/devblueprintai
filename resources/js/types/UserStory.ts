import type { DerivedFields } from "./DerivedFields";

export interface UserStory {
    id: string;
    content: string;
    original_content?: string | null;
    priority: "low" | "medium" | "high";
    position: number;
    is_ai_generated: boolean;
    created_at: string;
    updated_at: string;
    derived_fields?: DerivedFields;
    original_derived_fields?: DerivedFields | null;
}
