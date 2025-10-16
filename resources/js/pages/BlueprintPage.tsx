import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthCallToAction from "../components/AuthCallToAction";
import { GUEST_PROJECT_ID_KEY } from "../constants";
import { useProject } from "../hooks/useProject"; // Yeni hook'umuzu import ediyoruz

function BlueprintPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const [showClaimSuccess, setShowClaimSuccess] = useState(false);

    // Eski useState ve useEffect tabanlı veri çekme mantığını kaldırıyoruz.
    // Artık tüm veri yönetimi useProject hook'u tarafından yapılacak.
    const { data: project, isLoading, error } = useProject(projectId);

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
        // Bu useEffect sadece misafir projesi durumunu kontrol etmek için kaldı.
        const guestProjectId = localStorage.getItem(GUEST_PROJECT_ID_KEY);
        setIsGuestProject(!!(guestProjectId && guestProjectId === projectId));
    }, [projectId]);

    // React Query'nin isLoading'i ile Auth'un yüklenme durumunu birleştiriyoruz.
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
                {/* Hata nesnesinden mesajı göstermek daha güvenilir */}
                <p className="mt-4 text-lg text-gray-300">
                    {(error as any)?.message || "Could not load project data."}
                </p>
            </div>
        );
    }

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

            <div className="max-w-7xl mx-auto pb-24">
                <h1 className="text-3xl font-bold text-sky-400">
                    {project?.name}
                </h1>
                <p className="mt-2 text-md text-gray-400 italic">
                    Idea: "{project?.idea_text ?? "No idea provided yet."}"
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
