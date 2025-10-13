import React from "react";
import { Link } from "react-router-dom";

const AuthCallToAction: React.FC = () => {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl rounded-lg border border-sky-500/30 bg-gray-800/80 p-4 shadow-lg backdrop-blur-sm animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                    <h3 className="font-semibold text-white">
                        Save Your Blueprint!
                    </h3>
                    <p className="mt-1 text-sm text-gray-300">
                        Create a free account or sign in to save this project
                        and continue later.
                    </p>
                </div>
                <div className="flex flex-shrink-0 gap-3 mt-3 sm:mt-0">
                    <Link
                        to="/register"
                        className="rounded-md bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                    >
                        Create Account
                    </Link>
                    <Link
                        to="/login"
                        className="rounded-md bg-white/10 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Basit bir fade-in animasyonu için tailwind.config.js'e ekleyeceğiz.
// Şimdilik bu bileşeni bu şekilde bırakalım.

export default AuthCallToAction;
