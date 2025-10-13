import React, { useState } from "react";
import { Link } from "react-router-dom"; // useNavigate kaldırıldı çünkü artık AuthContext içinde
import { useAuth } from "../contexts/AuthContext";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login } = useAuth();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await login({ email, password });
            // Yönlendirme artık AuthContext tarafından yönetiliyor.
        } catch (err: any) {
            console.error("Login failed:", err);
            if (err.response && err.response.data && err.response.data.errors) {
                const errorMessages = Object.values(
                    err.response.data.errors
                ).flat();
                setError(errorMessages.join(" "));
            } else {
                setError(err.response?.data?.message || "Invalid credentials.");
            }
            setIsLoading(false); // Sadece hata durumunda isLoading'i burada false yap
        }
        // Başarılı durumda isLoading'i false yapmaya gerek yok, çünkü sayfa değişecek.
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h1 className="text-center text-3xl font-bold tracking-tight text-sky-400">
                        Sign in to your account
                    </h1>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Or{" "}
                        <Link
                            to="/register"
                            className="font-medium text-sky-500 hover:text-sky-400"
                        >
                            create an account
                        </Link>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium leading-6 text-gray-300"
                        >
                            Email address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium leading-6 text-gray-300"
                        >
                            Password
                        </label>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-500/20 p-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
