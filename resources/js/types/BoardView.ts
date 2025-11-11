export type BoardDensity = "comfortable" | "cozy" | "compact";

export type BoardSortOption =
    | "priority"
    | "var_id"
    | "over_limit"
    | "updated_at"
    | "board";

export interface BoardFilters {
    priority: "all" | "high" | "medium" | "low";
    overLimit: "all" | "over" | "within";
    angles: string[];
}
