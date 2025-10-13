import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext"; // useAuth hook'unu import et
import AuthCallToAction from "../components/AuthCallToAction"; // AuthCallToAction bileşenini import et

// Project tipini tanımlayalım. Şimdilik basit tutuyoruz.
interface Project {
    id: string;
    name: string;
    prompt: string;
    status: string;
    // blueprint verisi daha sonra eklenecek
}

function BlueprintPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user, isLoading: isAuthLoading } = useAuth(); // Auth context'inden kullanıcı durumunu al
    const [isGuestProject, setIsGuestProject] = useState(false);

    useEffect(() => {
        // Sayfa yüklendiğinde proje verilerini çekmek için bu fonksiyon çalışır.
        const fetchProjectData = async () => {
            if (!projectId) return; // projectId yoksa işlemi durdur

            setIsLoading(true);
            setError(null);

            try {
                await axios.get("/sanctum/csrf-cookie");
                const response = await axios.get(`/api/projects/${projectId}`);
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

        // Local Storage'daki misafir projesi ID'sini kontrol et
        const guestProjectId = localStorage.getItem("guestProjectId");
        if (guestProjectId && guestProjectId === projectId) {
            setIsGuestProject(true);
        } else {
            setIsGuestProject(false);
        }
    }, [projectId]); // Bu effect, projectId değiştiğinde yeniden çalışır.

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

    // AuthCallToAction bileşenini gösterme koşulu:
    // Kullanıcı giriş yapmamış (user null) VE bu bir misafir projesi
    const showAuthCallToAction = !user && isGuestProject;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto pb-24">
                {" "}
                {/* Alttaki banner için boşluk bırak */}
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
                {/* Gelecekte Trello benzeri pano buraya gelecek */}
            </div>

            {/* Koşullu olarak bileşeni göster */}
            {showAuthCallToAction && <AuthCallToAction />}
        </div>
    );
}

export default BlueprintPage;
