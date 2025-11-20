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
import { UserStory } from "@/types";
import { useBlueprintFilters } from "@/hooks/useBlueprintFilters";
import { useBlueprintExport } from "@/hooks/useBlueprintExport";

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
    const {
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
    } = useBlueprintFilters(project);
    const { handleDownloadAllCsv, isDownloading } = useBlueprintExport(project);
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
                        projectId={project.id}
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
                    onClearFilters={clearFilters}
                />

                <Board
                    project={project}
                    onCardSelect={handleCardSelect}
                    visibleEpics={filteredEpics}
                    density={density}
                    onManualSort={handleManualSort}
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
                onDownloadCsv={handleDownloadAllCsv}
                isDownloading={isDownloading}
            />

            {showAuthCallToAction && <AuthCallToAction />}
        </main>
    );
}

export default BlueprintPage;
