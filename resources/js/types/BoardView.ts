export type BoardDensity = "comfortable" | "cozy" | "compact";

export type BoardSortOption =
    | "priority"
    | "var_id"
    | "over_limit"
    | "updated_at"
    | "board";

export interface BoardFilters {
    priority: "all" | "high" | "medium" | "low";
    status: "all" | "todo" | "in_progress" | "done";
    overLimit: "all" | "over" | "within";
    angles: string[];
}
