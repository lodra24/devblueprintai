import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { useMyProjects, MY_PROJECTS_DEFAULT_PER_PAGE } from "@/hooks/useMyProjects";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ProjectListSkeleton } from "@/components/Skeletons";
import { getProject } from "@/api";
import { qk } from "@/lib/queryKeys";
import { routeUrls } from "@/routes";


const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

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

    const prefetchProject = useCallback(
        (projectId: string) => {
            void queryClient.prefetchQuery({
                queryKey: qk.project(projectId),
                queryFn: () => getProject(projectId),
                staleTime: 10 * 60 * 1000, // 10 minutes
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

    const renderContent = () => {
        if (!user) {
            return (
                <div className="text-center text-gray-400">
                    <p>You need to sign in to view your projects.</p>
                    <Link
                        to={routeUrls.login}
                        className="mt-4 inline-block rounded-md bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
                    >
                        Go to Login
                    </Link>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div role="status" aria-live="polite">
                    <span className="sr-only">Loading projects...</span>
                    <ProjectListSkeleton />
                </div>
            );
        }

        if (isError) {
            const status = error?.response?.status;

            if (status === 401) {
                return (
                    <div className="text-center text-gray-400">
                        <p>You need to sign in to view your projects.</p>
                        <Link
                            to={routeUrls.login}
                            className="mt-4 inline-block rounded-md bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
                        >
                            Go to Login
                        </Link>
                    </div>
                );
            }

            return (
                <div className="text-center text-red-400">
                    <p>
                        Error loading projects:{" "}
                        {getErrorMessage()}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="mt-4 rounded-md bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (!projectItems.length) {
            return (
                <div className="text-center text-gray-400">
                    <p>You don't have any saved projects yet.</p>
                    <Link
                        to={routeUrls.home}
                        className="mt-4 inline-block rounded-md bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
                    >
                        Create Your First Project
                    </Link>
                </div>
            );
        }

        return (
            <>
                <ul className="space-y-4">
                    {projectItems.map((project) => (
                        <li
                            key={project.id}
                            className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg bg-gray-800 p-4 shadow"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Last updated:{" "}
                                    {new Date(
                                        project.updated_at
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            <Link
                                to={routeUrls.blueprint(project.id)}
                                onMouseEnter={() => prefetchProject(project.id)}
                                className="flex-shrink-0 rounded-md bg-white/10 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
                            >
                                Open Blueprint
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="mt-6 flex flex-col gap-4 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        Showing {rangeStart}-{rangeEnd} of {total} projects
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handlePreviousPage}
                            disabled={!canPrevious}
                            className="rounded-md border border-white/10 px-3 py-2 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="hidden text-center sm:inline">
                            Page {currentPage} of {lastPage}
                        </span>
                        {isFetching && !isLoading && (
                            <span className="text-xs text-gray-400 sm:ml-2">
                                Updating...
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleNextPage}
                            disabled={!canNext}
                            className="rounded-md border border-white/10 px-3 py-2 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="border-b border-white/10 pb-4 mb-8">
                    <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
                        My Projects
                    </h1>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default DashboardPage;
