import React from "react";
import clsx from "clsx";

type Props = {
    titleTop: string;
    titleBottom: string;
    icon: "strategy" | "assets" | "insights";
    className?: string;
};

const VARIANTS = {
    strategy: {
        iconBg: "bg-indigo-50 text-indigo-600",
        borderHover: "group-hover:border-indigo-200",
        gradient: "from-indigo-500/5 to-transparent",
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
        ),
    },
    assets: {
        iconBg: "bg-emerald-50 text-emerald-600",
        borderHover: "group-hover:border-emerald-200",
        gradient: "from-emerald-500/5 to-transparent",
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
    },
    insights: {
        iconBg: "bg-amber-50 text-amber-600",
        borderHover: "group-hover:border-amber-200",
        gradient: "from-amber-500/5 to-transparent",
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        ),
    },
} as const;

export default function InfoCard({ titleTop, titleBottom, icon, className }: Props) {
    const variant = VARIANTS[icon];

    return (
        <div
            className={clsx(
                "group relative overflow-hidden rounded-2xl border border-stone/10 bg-white/60 p-6 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white/80",
                variant.borderHover,
                className
            )}
        >
            <div
                className={clsx(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none",
                    variant.gradient
                )}
            />

            <div className="relative z-10 flex flex-col items-start gap-4">
                <div
                    className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                        variant.iconBg
                    )}
                >
                    {variant.icon}
                </div>

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone/60">
                        {titleTop}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold text-ink leading-tight">
                        {titleBottom}
                    </p>
                </div>
            </div>
        </div>
    );
}
