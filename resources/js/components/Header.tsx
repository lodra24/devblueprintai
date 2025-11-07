import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { routeUrls } from "@/routes";

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate(routeUrls.home);
    };

    return (
        <header className="sticky top-0 z-40 border-b border-stone/10 bg-frost/80 backdrop-blur-md">
            <nav
                className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between"
                aria-label="Global"
            >
                <Link to={routeUrls.home} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent/60" />
                    <span className="font-display text-lg font-bold tracking-tight text-ink">
                        MarketingBlueprint <span className="font-normal text-stone">AI</span>
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link
                                to={routeUrls.dashboard}
                                className="text-sm text-stone hover:text-ink transition-colors"
                            >
                                My Projects
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="px-3 py-1.5 rounded-lg bg-ink text-white text-sm hover:opacity-90 transition-opacity"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to={routeUrls.login}
                                className="text-sm text-stone hover:text-ink transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to={routeUrls.register}
                                className="px-3 py-1.5 rounded-lg bg-ink text-white text-sm hover:opacity-90 transition-opacity"
                            >
                                Create Account
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
