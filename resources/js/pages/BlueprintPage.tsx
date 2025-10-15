import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import AuthCallToAction from "../components/AuthCallToAction";
import { GUEST_PROJECT_ID_KEY } from "../constants";

interface Project {
    id: string;
    name: string;
    prompt: string;
    status: string;
}

function BlueprintPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation(); // Yönlendirme state'ini okumak için
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showClaimSuccess, setShowClaimSuccess] = useState(false);

    const { user, isAuthLoading } = useAuth();
    const [isGuestProject, setIsGuestProject] = useState(false);

    useEffect(() => {
        // Yönlendirme ile gelen 'claimed' state'ini kontrol et
        if (location.state?.claimed) {
            setShowClaimSuccess(true);
            // Birkaç saniye sonra bildirimi kaldır
            const timer = setTimeout(() => setShowClaimSuccess(false), 5000);
            // Component unmount olursa timer'ı temizle
            return () => clearTimeout(timer);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchProjectData = async () => {
            if (!projectId) return;

            setIsLoading(true);
            setError(null);

            try {
                const response = await api.get(`/api/projects/${projectId}`);
                setProject(response.data);
            } catch (err: any) {
                console.error("Failed to fetch project data:", err);
                setError(
                    err.response?.data?.message ||
                        "Could not load project data."
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjectData();

        const guestProjectId = localStorage.getItem(GUEST_PROJECT_ID_KEY);
        if (guestProjectId && guestProjectId === projectId) {
            setIsGuestProject(true);
        } else {
            setIsGuestProject(false);
        }
    }, [projectId]);

    if (isLoading || isAuthLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
                <h1 className="text-3xl font-bold text-sky-400 animate-pulse">
                    Loading Blueprint...
                </h1>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
                <h1 className="text-3xl font-bold text-red-500">Error</h1>
                <p className="mt-4 text-lg text-gray-300">{error}</p>
            </div>
        );
    }

    const showAuthCallToAction = !user && isGuestProject;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
            {/* Başarı Bildirimi */}
            {showClaimSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md rounded-lg bg-green-500/90 p-4 text-white shadow-lg backdrop-blur-sm animate-fade-in-down">
                    <p className="text-center font-semibold">
                        Project successfully saved to your account!
                    </p>
                </div>
            )}

            <div className="max-w-7xl mx-auto pb-24">
                <h1 className="text-3xl font-bold text-sky-400">
                    {project?.name}
                </h1>
                <p className="mt-2 text-md text-gray-400 italic">
                    Prompt: "{project?.prompt}"
                </p>
                <div className="mt-6 p-4 bg-white/5 rounded-lg">
                    <p className="text-lg">
                        Status:{" "}
                        <span className="font-semibold text-yellow-400">
                            {project?.status}
                        </span>
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                        Blueprint data will appear here once generation is
                        complete.
                    </p>
                </div>
            </div>

            {showAuthCallToAction && <AuthCallToAction />}
        </div>
    );
}

export default BlueprintPage;
