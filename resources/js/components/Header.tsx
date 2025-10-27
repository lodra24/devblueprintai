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
        <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
            <nav
                className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
                aria-label="Global"
            >
                <div className="flex lg:flex-1">
                    <Link to={routeUrls.home} className="-m-1.5 p-1.5">
                        <span className="text-xl font-bold text-sky-400">
                            DevBlueprint AI
                        </span>
                    </Link>
                </div>
                <div className="flex flex-1 justify-end items-center gap-x-6">
                    {user ? (
                        <>
                            <Link
                                to={routeUrls.dashboard}
                                className="text-sm font-semibold leading-6 text-gray-300 hover:text-white"
                            >
                                My Projects
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="rounded-md bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to={routeUrls.login}
                                className="text-sm font-semibold leading-6 text-gray-300 hover:text-white"
                            >
                                Sign In
                            </Link>
                            <Link
                                to={routeUrls.register}
                                className="rounded-md bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
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
