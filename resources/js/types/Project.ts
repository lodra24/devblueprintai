import { Epic } from "./Epic";
import { BlueprintTelemetry } from "./BlueprintTelemetry";
import { SchemaSuggestion } from "./SchemaSuggestion";

export type ProjectStatus =
    | "pending"
    | "generating"
    | "parsing"
    | "ready"
    | "failed";

export interface ProjectMetrics {
    assets_total: number;
    high_priority_total: number;
    over_limit_total: number;
}

export interface Project {
    id: string;
    user_id: number | null;
    name: string;
    idea_text: string | null;
    status: ProjectStatus;
    progress: number;
    stage?: string | null;
    message?: string | null;
    epics: Epic[];
    schema_suggestions: SchemaSuggestion[];
    telemetry: BlueprintTelemetry | null;
    metrics?: ProjectMetrics | null;
    created_at: string;
    updated_at: string;
}
