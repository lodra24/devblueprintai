import React from "react";
import { Link } from "react-router-dom";

import { routeUrls } from "@/routes";

const AuthCallToAction: React.FC = () => (
    <div className="fixed bottom-6 left-1/2 z-30 w-11/12 max-w-2xl -translate-x-1/2">
        <div className="surface-panel surface-panel--muted flex flex-col items-center justify-between gap-4 rounded-2xl px-5 py-4 text-ink shadow-deep animate-authRise sm:flex-row">
            <div className="text-center sm:text-left">
                <h3 className="font-display text-lg font-semibold text-ink">
                    Save Your Blueprint
                </h3>
                <p className="mt-1 text-sm text-stone">
                    Create a free account or sign in to save this project and continue later.
                </p>
            </div>
            <div className="flex flex-shrink-0 gap-3">
                <Link
                    to={routeUrls.register}
                    className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                    Create Account
                </Link>
                <Link
                    to={routeUrls.login}
                    className="rounded-full border border-stone/20 px-4 py-2 text-sm font-semibold text-stone transition hover:border-accent/30"
                >
                    Sign In
                </Link>
            </div>
        </div>
    </div>
);

export default AuthCallToAction;
