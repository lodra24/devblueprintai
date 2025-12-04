import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { routeUrls } from "@/routes";
import { PrismLogoIcon } from "@/components/icons";

interface AuthRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
}

const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
    isOpen,
    onClose,
    title = "Account Required",
    description = "Sign up to prioritize your strategy, save variations, and export your blueprint.",
}) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (typeof document === "undefined" || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 sm:py-0">
            <div
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white p-6 shadow-2xl animate-pop">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-stone/10 bg-gradient-to-br from-indigo-50 to-white shadow-inner">
                        <PrismLogoIcon className="h-6 w-6" />
                    </div>

                    <h2 className="font-display text-xl font-bold text-ink">
                        {title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-stone">
                        {description}
                    </p>

                    <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                        <Link
                            to={routeUrls.register}
                            className="flex-1 inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-ink/90"
                        >
                            Create Account
                        </Link>
                        <Link
                            to={routeUrls.login}
                            className="flex-1 inline-flex items-center justify-center rounded-xl border border-stone/20 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-accent/40 hover:bg-stone-50"
                        >
                            Sign In
                        </Link>
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-5 text-xs font-medium text-stone/50 underline-offset-2 transition-colors hover:text-stone hover:underline"
                    >
                        Continue as guest (Read Only)
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AuthRequiredModal;
