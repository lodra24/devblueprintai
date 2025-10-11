import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://devblueprint.test"; // API adresimiz

function HomePage() {
    const [name, setName] = useState("");
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post("/api/projects", {
                name: name,
                prompt: prompt,
            });

            if (response.status === 202) {
                const projectId = response.data.project_id;

                // YENİ EKLENEN ADIM: Proje ID'sini Local Storage'a kaydet
                localStorage.setItem("guestProjectId", projectId);

                navigate(`/blueprint/${projectId}`);
            }
        } catch (err: any) {
            console.error("Project creation failed:", err);
            setError(
                err.response?.data?.message || "An unexpected error occurred."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4 sm:p-6 md:p-8">
            <div className="text-center w-full max-w-2xl">
                <h1 className="text-4xl sm:text-5xl font-bold text-sky-400">
                    DevBluePrint AI
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-gray-300">
                    Your Project Assistant from Idea to Action
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-10 text-left space-y-6"
                >
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-300 mb-2"
                        >
                            Project Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6"
                            placeholder="e.g., E-commerce Platform"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="prompt"
                            className="block text-sm font-medium text-gray-300 mb-2"
                        >
                            Your Project Idea (in one sentence)
                        </label>
                        <textarea
                            id="prompt"
                            name="prompt"
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            required
                            className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6"
                            placeholder="A platform where users can print and sell their own designs on t-shirts..."
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-500/20 p-4">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full rounded-md bg-sky-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Generating..."
                                : "Generate Project Blueprint"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default HomePage;
