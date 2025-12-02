import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { routeUrls } from "@/routes";

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate(routeUrls.home);
    };

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    return (
        <header className="sticky top-0 z-40 border-b border-stone/10 bg-frost/80 backdrop-blur-md">
            <nav
                className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6"
                aria-label="Global"
            >
                <Link to={routeUrls.home} className="group flex items-center gap-2.5 text-left">
                    <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="drop-shadow-sm"
                        >
                            <defs>
                                <linearGradient
                                    id="prismBlueGradient"
                                    x1="2"
                                    y1="3"
                                    x2="22"
                                    y2="20"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop offset="0%" stopColor="#6366F1" />
                                    <stop offset="100%" stopColor="#0EA5E9" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M12 3L21 20H3L12 3Z"
                                stroke="url(#prismBlueGradient)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M7.5 11.5L12 11.5L16.5 20"
                                stroke="url(#prismBlueGradient)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="opacity-60"
                            />
                        </svg>
                    </div>

                    <span className="font-display text-xl font-bold tracking-tight text-ink">
                        Prism <span className="font-medium text-stone/50">AI</span>
                    </span>
                </Link>

                <div className="hidden items-center gap-4 sm:flex">
                    {user ? (
                        <>
                            <Link
                                to={routeUrls.dashboard}
                                className="text-sm font-medium text-stone transition-colors hover:text-ink"
                            >
                                Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-md"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to={routeUrls.login}
                                className="text-sm font-medium text-stone transition-colors hover:text-ink"
                            >
                                Sign In
                            </Link>
                            <Link
                                to={routeUrls.register}
                                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-md"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="rounded-lg border border-stone/30 p-2 text-stone transition-colors hover:border-stone/60 hover:text-ink sm:hidden"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    aria-label="Toggle navigation"
                    aria-expanded={isMenuOpen}
                >
                    <span className="sr-only">Open menu</span>
                    <span
                        className={`block h-0.5 w-5 bg-current transition-transform ${
                            isMenuOpen ? "translate-y-1.5 rotate-45" : ""
                        }`}
                    />
                    <span
                        className={`mt-1 block h-0.5 w-5 bg-current transition-opacity ${
                            isMenuOpen ? "opacity-0" : "opacity-100"
                        }`}
                    />
                    <span
                        className={`mt-1 block h-0.5 w-5 bg-current transition-transform ${
                            isMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
                        }`}
                    />
                </button>
            </nav>
            <div
                className={`sm:hidden ${
                    isMenuOpen ? "max-h-60 opacity-100 border-t" : "max-h-0 opacity-0"
                } overflow-hidden border-stone/10 bg-frost/95 px-4 transition-all duration-200`}
            >
                <div className="flex flex-col gap-2 pt-3 pb-4">
                    {user ? (
                        <>
                            <Link
                                to={routeUrls.dashboard}
                                className="rounded-lg border border-stone/20 px-3 py-2 text-sm text-ink"
                            >
                                My Projects
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-lg bg-ink px-3 py-2 text-sm text-white transition-opacity hover:opacity-90"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to={routeUrls.login}
                                className="rounded-lg border border-stone/20 px-3 py-2 text-sm text-ink"
                            >
                                Sign In
                            </Link>
                            <Link
                                to={routeUrls.register}
                                className="rounded-lg bg-ink px-3 py-2 text-sm text-white transition-opacity hover:opacity-90"
                            >
                                Create Account
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
