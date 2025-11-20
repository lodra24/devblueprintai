import { useMemo, useState } from "react";
import { BoardDensity, BoardFilters, BoardSortOption, Epic, Project, UserStory } from "@/types";

type UseBlueprintFiltersResult = {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    filters: BoardFilters;
    setFilters: (value: BoardFilters) => void;
    sortBy: BoardSortOption;
    setSortBy: (value: BoardSortOption) => void;
    density: BoardDensity;
    setDensity: (value: BoardDensity) => void;
    availableAngles: string[];
    filteredEpics: Epic[];
    handleManualSort: () => void;
    clearFilters: () => void;
};

export const useBlueprintFilters = (
    project?: Project | null
): UseBlueprintFiltersResult => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<BoardFilters>({
        priority: "all",
        overLimit: "all",
        angles: [],
    });
    const [sortBy, setSortBy] = useState<BoardSortOption>("priority");
    const [density, setDensity] = useState<BoardDensity>("comfortable");

    const availableAngles = useMemo(() => {
        if (!project) {
            return [];
        }
        const angleSet = new Set<string>();
        project.epics.forEach((epic) => {
            epic.user_stories.forEach((story) => {
                const angle = story.derived_fields?.meta?.angle_name?.trim();
                if (angle) {
                    angleSet.add(angle);
                }
            });
        });
        return Array.from(angleSet).sort((a, b) => a.localeCompare(b));
    }, [project]);

    const filteredEpics = useMemo(() => {
        if (!project) {
            return [];
        }

        const normalizedSearch = searchTerm.trim().toLowerCase();
        const priorityOrder = {
            high: 0,
            medium: 1,
            low: 2,
        } as const;
        const compareByPosition = (a: UserStory, b: UserStory) =>
            (a.position ?? 0) - (b.position ?? 0);
        const compareByUpdatedAt = (a: UserStory, b: UserStory) => {
            const parse = (value?: string | null) => {
                if (!value) return 0;
                const timestamp = new Date(value).getTime();
                return Number.isNaN(timestamp) ? 0 : timestamp;
            };
            const diff = parse(b.updated_at) - parse(a.updated_at);
            return diff !== 0 ? diff : compareByPosition(a, b);
        };

        const sorters: Record<BoardSortOption, (a: UserStory, b: UserStory) => number> = {
            priority: (a, b) => {
                const diff =
                    priorityOrder[a.priority] - priorityOrder[b.priority];
                return diff !== 0 ? diff : compareByPosition(a, b);
            },
            var_id: (a, b) => {
                const varA = a.derived_fields?.meta?.var_id ?? "";
                const varB = b.derived_fields?.meta?.var_id ?? "";
                const diff = varA.localeCompare(varB);
                return diff !== 0 ? diff : compareByPosition(a, b);
            },
            over_limit: (a, b) => {
                const diff =
                    (b.derived_fields?.over_limit_count ?? 0) -
                    (a.derived_fields?.over_limit_count ?? 0);
                return diff !== 0 ? diff : compareByPosition(a, b);
            },
            updated_at: compareByUpdatedAt,
            board: compareByPosition,
        };

        const matchesSearch = (story: UserStory) => {
            if (!normalizedSearch) {
                return true;
            }
            const derived = story.derived_fields;
            const haystack: string[] = [];
            if (derived?.assets) {
                haystack.push(
                    ...Object.values(derived.assets).filter(
                        (value): value is string => typeof value === "string"
                    )
                );
            }
            if (derived?.meta?.var_id) {
                haystack.push(derived.meta.var_id);
            }
            if (derived?.meta?.angle_name) {
                haystack.push(derived.meta.angle_name);
            }
            if (story.content) {
                haystack.push(story.content);
            }
            return haystack.some((text) =>
                text.toLowerCase().includes(normalizedSearch)
            );
        };

        const matchesFilters = (story: UserStory) => {
            if (
                filters.priority !== "all" &&
                story.priority !== filters.priority
            ) {
                return false;
            }
            if (filters.overLimit !== "all") {
                const hasOver =
                    (story.derived_fields?.over_limit_count ?? 0) > 0
                        ? "over"
                        : "within";
                if (filters.overLimit !== hasOver) {
                    return false;
                }
            }
            if (filters.angles.length > 0) {
                const angle = story.derived_fields?.meta?.angle_name;
                if (!angle || !filters.angles.includes(angle)) {
                    return false;
                }
            }
            return true;
        };

        const hasActiveFilters =
            normalizedSearch.length > 0 ||
            filters.priority !== "all" ||
            filters.overLimit !== "all" ||
            filters.angles.length > 0;

        const mapped = project.epics.map((epic) => {
            const stories = epic.user_stories
                .filter(matchesSearch)
                .filter(matchesFilters)
                .slice()
                .sort(sorters[sortBy]);

            return {
                ...epic,
                user_stories: stories,
            };
        });

        return hasActiveFilters
            ? mapped.filter((epic) => epic.user_stories.length > 0)
            : mapped;
    }, [project, searchTerm, filters, sortBy]);

    const clearFilters = () => {
        setSearchTerm("");
        setFilters({ priority: "all", overLimit: "all", angles: [] });
    };

    const handleManualSort = () => setSortBy("board");

    return {
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        density,
        setDensity,
        availableAngles,
        filteredEpics,
        handleManualSort,
        clearFilters,
    };
};
