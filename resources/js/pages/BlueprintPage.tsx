import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthCallToAction from "@/components/AuthCallToAction";
import { GUEST_PROJECT_ID_KEY } from "@/constants";
import { useBlueprintData } from "@/hooks/useBlueprintData";
import { useBlueprintStatusBarVisibility } from "@/hooks/useBlueprintStatusBarVisibility";
import { useRetryBlueprint } from "@/hooks/useRetryBlueprint";
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
        overLimit: "all",
        angles: [],
    });
    const [sortBy, setSortBy] = useState<BoardSortOption>("priority");
    const [density, setDensity] = useState<BoardDensity>("comfortable");
    const showStatusBar = useBlueprintStatusBarVisibility(
        project?.id,
        project?.status
    );
    const { retry: retryBlueprint, isRetrying } = useRetryBlueprint(project?.id);

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
                <div className="space-y-8">
                    <div className="surface-panel surface-panel--muted p-6 animate-pulse">
                        <div className="h-5 w-2/5 rounded-full bg-stone/20" />
                        <div className="mt-3 h-4 w-3/5 rounded-full bg-stone/15" />
                        <div className="mt-6 h-3 w-1/3 rounded-full bg-stone/15" />
                    </div>
                    <BoardSkeleton />
                </div>
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
                <div className="surface-panel surface-panel--muted mt-10 px-6 py-8 text-center shadow-deep">
                    <h1 className="font-display text-2xl font-semibold text-ink">
                        Something went wrong
                    </h1>
                    <p className="mt-3 text-base text-stone">{message}</p>
                </div>
            );
        }

        if (!project) {
            return (
                <div className="surface-panel surface-panel--muted mt-10 px-6 py-10 text-center shadow-deep">
                    <p className="text-base text-stone">
                        We couldn't find this blueprint. Try refreshing the page or
                        returning to your dashboard.
                    </p>
                </div>
            );
        }

        const ideaText = project.idea_text?.trim();

        return (
            <>
                <header className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone/70">
                        Blueprint overview
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
                            {project.name}
                        </h1>
                        {isFetching && (
                            <span className="text-sm font-medium text-stone">
                                Syncing data...
                            </span>
                        )}
                    </div>
                    <p className="text-base text-stone">
                        Idea:{" "}
                        {ideaText ? (
                            <span className="font-medium text-ink/80">{ideaText}</span>
                        ) : (
                            <span className="text-stone/80">No idea provided yet.</span>
                        )}
                    </p>
                </header>

                {showStatusBar && (
                    <BlueprintStatusBar
                        status={project.status}
                        progress={project.progress}
                        stage={project.stage}
                        message={project.message}
                        onRetry={
                            project.status === "failed"
                                ? retryBlueprint
                                : undefined
                        }
                        isRetrying={isRetrying}
                    />
                )}

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
                        setFilters({ priority: "all", overLimit: "all", angles: [] });
                    }}
                />

                <Board
                    project={project}
                    onCardSelect={handleCardSelect}
                    visibleEpics={filteredEpics}
                    density={density}
                    onManualSort={() => setSortBy("board")}
                />

                <div className="mt-12 space-y-10">
                    <SchemaPanel project={project} />
                    <ComparePanel project={project} />
                </div>
            </>
        );
    };

    const showAuthCallToAction = !user && isGuestProject;

    return (
        <main className="relative min-h-screen bg-frost text-ink">
            <div className="grain" />
            <div className="pointer-events-none fixed inset-0 bg-minimal" />

            {showClaimSuccess && (
                <div className="fixed left-1/2 top-6 z-40 w-11/12 max-w-lg -translate-x-1/2">
                    <div className="rounded-2xl border border-emerald-200 bg-white/95 px-5 py-4 text-center text-sm font-semibold text-emerald-900 shadow-deep">
                        Project successfully saved to your account!
                    </div>
                </div>
            )}

            <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
                {renderContent()}
            </div>

            <ReaderPanel
                story={selectedStory}
                isOpen={!!selectedStoryId}
                onClose={() => setSelectedStoryId(null)}
            />

            {showAuthCallToAction && <AuthCallToAction />}
        </main>
    );
}

export default BlueprintPage;
