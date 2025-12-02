import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { SearchSolidIcon } from "@/components/icons";
import { useMyProjects, MY_PROJECTS_DEFAULT_PER_PAGE } from "@/hooks/useMyProjects";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ProjectListSkeleton } from "@/components/Skeletons";
import { getProject } from "@/api";
import { qk } from "@/lib/queryKeys";
import { routeUrls } from "@/routes";
import ProjectRow from "@/components/dashboard/ProjectRow";
import { useRowMenu } from "@/hooks/useRowMenu";

const updatedFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const { openMenuId, toggleMenu, closeMenu } = useRowMenu();

    const {
        data: projectPage,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useMyProjects({ page, perPage: MY_PROJECTS_DEFAULT_PER_PAGE });

    const lastToastMessageRef = useRef<string | null>(null);

    const meta = projectPage?.meta;
    const projectItems = projectPage?.data ?? [];

    const {
        currentPage,
        lastPage,
        total,
        rangeStart,
        rangeEnd,
        canPrevious,
        canNext,
    } = useMemo(() => {
        const current = meta?.current_page ?? page;
        const last = Math.max(meta?.last_page ?? 1, 1);
        const totalItems = meta?.total ?? 0;
        const start = totalItems === 0 ? 0 : (meta?.from ?? 0);
        const end = totalItems === 0 ? 0 : (meta?.to ?? 0);

        return {
            currentPage: current,
            lastPage: last,
            total: totalItems,
            rangeStart: start,
            rangeEnd: end,
            canPrevious: current > 1,
            canNext: current < last,
        };
    }, [meta, page]);

    useEffect(() => {
        if (meta && page > lastPage) {
            setPage(lastPage);
        }
    }, [meta, page, lastPage]);

    useEffect(() => {
        if (!user && page !== 1) {
            setPage(1);
        }
    }, [user, page]);

    useEffect(() => {
        if (!openMenuId) {
            return;
        }

        if (!projectItems.some((project) => project.id === openMenuId)) {
            closeMenu();
        }
    }, [openMenuId, projectItems, closeMenu]);

    const prefetchProject = useCallback(
        (projectId: string) => {
            void queryClient.prefetchQuery({
                queryKey: qk.project(projectId),
                queryFn: () => getProject(projectId),
                staleTime: 10 * 60 * 1000,
            });
        },
        [queryClient]
    );

    const getErrorMessage = useCallback((): string => {
        if (!error) {
            return "Unable to load projects.";
        }

        if (!error.response) {
            return "Network error. Please check your connection.";
        }

        const responseData = error.response.data;

        if (typeof responseData === "string") {
            return responseData;
        }

        if (responseData && typeof responseData === "object") {
            const payload = responseData as Record<string, unknown>;

            if (payload.errors && typeof payload.errors === "object") {
                const firstError = Object.values(
                    payload.errors as Record<string, unknown>
                ).find((messages) => Array.isArray(messages) && messages[0]);

                if (
                    Array.isArray(firstError) &&
                    typeof firstError[0] === "string"
                ) {
                    return firstError[0];
                }
            }

            if (typeof payload.message === "string") {
                return payload.message;
            }

            if (typeof payload.error === "string") {
                return payload.error;
            }
        }

        return error.message || "Unable to load projects.";
    }, [error]);

    useEffect(() => {
        if (!isError || !error) {
            lastToastMessageRef.current = null;
            return;
        }

        const status = error.response?.status;
        if (status === 401) {
            lastToastMessageRef.current = null;
            return;
        }

        const message = getErrorMessage();
        if (message && lastToastMessageRef.current !== message) {
            showToast({ message, type: "error" });
            lastToastMessageRef.current = message;
        }
    }, [isError, error, getErrorMessage, showToast]);

    const handlePreviousPage = useCallback(() => {
        setPage((prev) => (prev > 1 ? prev - 1 : prev));
    }, []);

    const handleNextPage = useCallback(() => {
        setPage((prev) => (prev < lastPage ? prev + 1 : prev));
    }, [lastPage]);

    const filteredProjects = useMemo(() => {
        if (!searchTerm.trim()) {
            return projectItems;
        }
        const term = searchTerm.trim().toLowerCase();
        return projectItems.filter((project) =>
            project.name.toLowerCase().includes(term)
        );
    }, [projectItems, searchTerm]);

    const paginationSummary = useMemo(() => {
        if (searchTerm.trim()) {
            return `Showing ${filteredProjects.length} of ${projectItems.length} results`;
        }

        if (!total) {
            return "No projects to display";
        }

        return `Showing ${rangeStart}-${rangeEnd} of ${total} projects`;
    }, [filteredProjects.length, projectItems.length, rangeStart, rangeEnd, total, searchTerm]);

    const renderContent = () => {
        if (!user) {
            return (
                <div className="text-center text-stone">
                    <p>You need to sign in to view your projects.</p>
                    <Link
                        to={routeUrls.login}
                        className="mt-4 inline-flex justify-center open-btn bg-pastel-lilac"
                    >
                        Go to Login
                    </Link>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div
                    className="rounded-2xl bg-white/70 p-6 shadow-deep"
                    role="status"
                    aria-live="polite"
                >
                    <span className="sr-only">Loading projects...</span>
                    <ProjectListSkeleton />
                </div>
            );
        }

        if (isError) {
            const status = error?.response?.status;

            if (status === 401) {
                return (
                    <div className="text-center text-stone">
                        <p>You need to sign in to view your projects.</p>
                        <Link
                            to={routeUrls.login}
                            className="mt-4 inline-flex justify-center open-btn bg-pastel-lilac"
                        >
                            Go to Login
                        </Link>
                    </div>
                );
            }

            return (
                <div className="text-center text-red-600">
                    <p>Error loading projects: {getErrorMessage()}</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-4 inline-flex justify-center open-btn bg-pastel-rose text-ink border border-stone/20 hover:text-white hover:bg-accent hover:border-transparent"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (!projectItems.length) {
            return (
                <div className="text-center text-stone">
                    <p>You don't have any saved projects yet.</p>
                    <Link
                        to={routeUrls.home}
                        className="mt-4 inline-flex justify-center open-btn bg-pastel-mint text-ink border border-stone/20 hover:text-white hover:bg-accent hover:border-transparent"
                    >
                        Create Your First Project
                    </Link>
                </div>
            );
        }

        if (!filteredProjects.length) {
            return (
                <div className="text-center text-stone">
                    <p>No projects match “{searchTerm}”. Try a different keyword.</p>
                </div>
            );
        }

        return (
            <>
                <ul className="space-y-4">
                    {filteredProjects.map((project) => (
                        <ProjectRow
                            key={project.id}
                            project={project}
                            blueprintHref={routeUrls.blueprint(project.id)}
                            lastUpdatedLabel={updatedFormatter.format(
                                new Date(project.updated_at)
                            )}
                            isMenuOpen={openMenuId === project.id}
                            onToggleMenu={() => toggleMenu(project.id)}
                            onCloseMenu={closeMenu}
                            onPrefetch={() => prefetchProject(project.id)}
                        />
                    ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 text-sm text-stone sm:flex-row sm:items-center sm:justify-between">
                    <div>{paginationSummary}</div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="open-btn bg-pastel-mint text-ink border border-stone/20 hover:text-white hover:bg-accent hover:border-transparent"
                            onClick={handlePreviousPage}
                            disabled={!canPrevious}
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 rounded-lg border border-stone/20 bg-white">
                            Page {currentPage} of {lastPage}
                        </span>
                        <button
                            type="button"
                            className="open-btn bg-pastel-lilac text-ink border border-stone/20 hover:text-white hover:bg-accent hover:border-transparent"
                            onClick={handleNextPage}
                            disabled={!canNext}
                        >
                            Next
                        </button>
                    </div>
                </div>
                {isFetching && !isLoading && (
                    <p className="mt-2 text-center text-xs text-stone/70">
                        Updating…
                    </p>
                )}
            </>
        );
    };

    return (
        <main className="relative z-10 font-body text-ink">
            <div className="grain" />
            <div className="fixed inset-0 bg-minimal pointer-events-none" />

            <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16">
                <div className="flex items-end justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
                            My Projects
                        </h1>
                        <div className="mt-2 soft-sep" />
                    </div>
                    <div className="hidden sm:block w-[220px]">
                        <Link
                            to={routeUrls.home}
                            className="btn-editorial inline-flex justify-center"
                        >
                            New Project
                        </Link>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    <div className="relative flex-1">
                        <input
                            className="input-clean toolbar-input"
                            placeholder="Search projects…"
                            aria-label="Search projects"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            disabled={!user || isLoading}
                        />
                        <SearchSolidIcon className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    </div>
                    <div className="sm:hidden">
                        <Link
                            to={routeUrls.home}
                            className="btn-editorial inline-flex justify-center"
                        >
                            New Project
                        </Link>
                    </div>
                </div>

                <div className="mt-6">{renderContent()}</div>
            </section>
        </main>
    );
};

export default DashboardPage;
