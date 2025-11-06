import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthCallToAction from "@/components/AuthCallToAction";
import { GUEST_PROJECT_ID_KEY } from "@/constants";
import { useBlueprintData } from "@/hooks/useBlueprintData";
import { BoardSkeleton } from "@/components/Skeletons";
import Board from "@/components/Board";
import BlueprintStatusBar from "@/components/BlueprintStatusBar";
import SchemaPanel from "@/components/SchemaPanel";
import ReaderPanel from "@/components/ReaderPanel";
import ComparePanel from "@/components/ComparePanel";
import BoardFilterBar from "@/components/BoardFilterBar";
import { BoardDensity, BoardFilters, BoardSortOption } from "@/types";
import { UserStory } from "@/types";

function BlueprintPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const [showClaimSuccess, setShowClaimSuccess] = useState(false);

    const {
        data: project,
        isLoading,
        error,
        isFetching,
    } = useBlueprintData(projectId);

    const { user, isAuthLoading } = useAuth();
    const [isGuestProject, setIsGuestProject] = useState(false);
    const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<BoardFilters>({
        priority: "all",
        status: "all",
        overLimit: "all",
        angles: [],
    });
    const [sortBy, setSortBy] = useState<BoardSortOption>("priority");
    const [density, setDensity] = useState<BoardDensity>("comfortable");

    useEffect(() => {
        if (location.state?.claimed) {
            setShowClaimSuccess(true);
            const timer = setTimeout(() => setShowClaimSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [location.state]);

    useEffect(() => {
        const guestProjectId = localStorage.getItem(GUEST_PROJECT_ID_KEY);
        setIsGuestProject(!!(guestProjectId && guestProjectId === projectId));
    }, [projectId]);

    const selectedStory = useMemo(() => {
        if (!project || !selectedStoryId) {
            return null;
        }

        for (const epic of project.epics) {
            const story = epic.user_stories.find(
                (item) => item.id === selectedStoryId
            );
            if (story) {
                return story;
            }
        }

        return null;
    }, [project, selectedStoryId]);

    useEffect(() => {
        if (!selectedStoryId || selectedStory) {
            return;
        }

        setSelectedStoryId(null);
    }, [selectedStory, selectedStoryId]);

    const handleCardSelect = (story: UserStory) => {
        setSelectedStoryId(story.id);
    };

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
            if (filters.status !== "all" && story.status !== filters.status) {
                return false;
            }
            if (filters.overLimit !== "all") {
                const hasOver =
                    (story.derived_fields?.over_limit_count ?? 0) > 0 ? "over" : "within";
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
            filters.status !== "all" ||
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

    const renderContent = () => {
        if (isLoading || isAuthLoading) {
            return (
                <>
                    <div className="animate-pulse">
                        <div className="h-8 w-3/4 rounded bg-gray-700" />
                        <div className="mt-3 h-4 w-1/2 rounded bg-gray-700" />
                    </div>
                    <BoardSkeleton />
                </>
            );
        }

        if (error) {
            const responseData = error.response?.data;
            const responseMessage =
                typeof responseData === "string"
                    ? responseData
                    : typeof responseData === "object" &&
                      responseData !== null &&
                      "message" in responseData
                      ? (responseData as { message?: string }).message
                      : undefined;
            const message =
                responseMessage ??
                error.message ??
                "Could not load project data.";
            return (
                <div className="mt-10 flex flex-col items-center justify-center text-center">
                    <h1 className="text-3xl font-bold text-red-500">Error</h1>
                    <p className="mt-4 text-lg text-gray-300">{message}</p>
                </div>
            );
        }

        return (
            <>
                <h1 className="flex items-center gap-4 text-3xl font-bold text-sky-400">
                    <span>{project?.name}</span>
                    {isFetching && (
                        <span className="text-sm text-gray-400 animate-pulse">
                            Updating...
                        </span>
                    )}
                </h1>
                <p className="mt-2 text-md italic text-gray-400">
                    Idea: "{project?.idea_text ?? "No idea provided yet."}"
                </p>
                {project ? (
                    <BlueprintStatusBar
                        status={project.status}
                        progress={project.progress}
                        stage={project.stage}
                        message={project.message}
                    />
                ) : null}
                {project ? (
                    <BoardFilterBar
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        filters={filters}
                        onFiltersChange={(nextFilters) => setFilters(nextFilters)}
                        sortBy={sortBy}
                        onSortByChange={setSortBy}
                        density={density}
                        onDensityChange={setDensity}
                        availableAngles={availableAngles}
                        onClearFilters={() => {
                            setSearchTerm("");
                            setFilters({ priority: "all", status: "all", overLimit: "all", angles: [] });
                        }}
                    />
                ) : null}
                {project ? (
                    <Board
                        project={project}
                        onCardSelect={handleCardSelect}
                        visibleEpics={filteredEpics}
                        density={density}
                        onManualSort={() => setSortBy("board")}
                    />
                ) : null}
                {project ? <SchemaPanel project={project} /> : null}
                {project ? <ComparePanel project={project} /> : null}
            </>
        );
    };

    const showAuthCallToAction = !user && isGuestProject;

    return (
        <div className="min-h-screen bg-gray-900 p-4 text-white sm:p-6 md:p-8">
            {showClaimSuccess && (
                <div className="fixed left-1/2 top-4 z-50 w-11/12 max-w-md -translate-x-1/2 animate-fade-in-down rounded-lg bg-green-500/90 p-4 text-white shadow-lg backdrop-blur-sm">
                    <p className="text-center font-semibold">
                        Project successfully saved to your account!
                    </p>
                </div>
            )}

            <div className="mx-auto max-w-7xl pb-24">{renderContent()}</div>

            <ReaderPanel
                story={selectedStory}
                isOpen={!!selectedStoryId}
                onClose={() => setSelectedStoryId(null)}
            />

            {showAuthCallToAction && <AuthCallToAction />}
        </div>
    );
}

export default BlueprintPage;
