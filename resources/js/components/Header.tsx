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
                <Link
                    to={routeUrls.home}
                    className="flex items-center gap-3 text-left"
                >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent/60" />
                    <span className="font-display text-base font-bold tracking-tight text-ink sm:text-lg">
                        MarketingBlueprint <span className="font-normal text-stone">AI</span>
                    </span>
                </Link>

                <div className="hidden items-center gap-4 sm:flex">
                    {user ? (
                        <>
                            <Link
                                to={routeUrls.dashboard}
                                className="text-sm text-stone transition-colors hover:text-ink"
                            >
                                My Projects
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-lg bg-ink px-3 py-1.5 text-sm text-white transition-opacity hover:opacity-90"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to={routeUrls.login}
                                className="text-sm text-stone transition-colors hover:text-ink"
                            >
                                Sign In
                            </Link>
                            <Link
                                to={routeUrls.register}
                                className="rounded-lg bg-ink px-3 py-1.5 text-center text-sm text-white transition-opacity hover:opacity-90"
                            >
                                Create Account
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
