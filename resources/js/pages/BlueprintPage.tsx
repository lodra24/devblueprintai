import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthCallToAction from "@/components/AuthCallToAction";
import { GUEST_PROJECT_ID_KEY } from "@/constants";
import { useBlueprintData } from "@/hooks/useBlueprintData";
import { BoardSkeleton } from "@/components/Skeletons"; // Import BoardSkeleton
import Board from "@/components/Board"; // Import Board

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

    const renderContent = () => {
        if (isLoading || isAuthLoading) {
            return (
                <>
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-700 rounded w-1/2 mt-3"></div>
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
                <div className="flex flex-col items-center justify-center text-center mt-10">
                    <h1 className="text-3xl font-bold text-red-500">Error</h1>
                    <p className="mt-4 text-lg text-gray-300">{message}</p>
                </div>
            );
        }

        return (
            <>
                <h1 className="text-3xl font-bold text-sky-400 flex items-center gap-4">
                    <span>{project?.name}</span>
                    {isFetching && (
                        <span className="text-sm text-gray-400 animate-pulse">
                            Updating...
                        </span>
                    )}
                </h1>
                <p className="mt-2 text-md text-gray-400 italic">
                    Idea: "{project?.idea_text ?? "No idea provided yet."}"
                </p>
                {/* Board component will be rendered here */}
                <Board project={project} />
            </>
        );
    };

    const showAuthCallToAction = !user && isGuestProject;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
            {showClaimSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md rounded-lg bg-green-500/90 p-4 text-white shadow-lg backdrop-blur-sm animate-fade-in-down">
                    <p className="text-center font-semibold">
                        Project successfully saved to your account!
                    </p>
                </div>
            )}

            <div className="max-w-7xl mx-auto pb-24">{renderContent()}</div>

            {showAuthCallToAction && <AuthCallToAction />}
        </div>
    );
}

export default BlueprintPage;
