import React from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

import { routeUrls } from "@/routes";

type Props = {
    active: "login" | "register";
};

export default function AuthToggle({ active }: Props) {
    const itemClass =
        "flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition-all duration-200";

    return (
        <nav className="flex w-full max-w-xs items-center gap-2 rounded-full bg-white/70 p-1 text-stone shadow-inner">
            <Link
                to={routeUrls.login}
                className={clsx(
                    itemClass,
                    active === "login"
                        ? "bg-ink text-white shadow-lg"
                        : "text-ink/50 hover:text-ink"
                )}
            >
                Sign in
            </Link>
            <Link
                to={routeUrls.register}
                className={clsx(
                    itemClass,
                    active === "register"
                        ? "bg-ink text-white shadow-lg"
                        : "text-ink/50 hover:text-ink"
                )}
            >
                Create account
            </Link>
        </nav>
    );
}
