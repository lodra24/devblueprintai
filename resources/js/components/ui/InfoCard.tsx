import React from "react";
import clsx from "clsx";
import { AssetsIcon, InsightsIcon, StrategyIcon } from "@/components/icons";

const VARIANTS = {
    strategy: {
        iconBg: "bg-indigo-50 text-indigo-600",
        borderHover: "group-hover:border-indigo-200",
        gradient: "from-indigo-500/5 to-transparent",
        Icon: StrategyIcon,
    },
    assets: {
        iconBg: "bg-emerald-50 text-emerald-600",
        borderHover: "group-hover:border-emerald-200",
        gradient: "from-emerald-500/5 to-transparent",
        Icon: AssetsIcon,
    },
    insights: {
        iconBg: "bg-amber-50 text-amber-600",
        borderHover: "group-hover:border-amber-200",
        gradient: "from-amber-500/5 to-transparent",
        Icon: InsightsIcon,
    },
} as const;

type VariantKey = keyof typeof VARIANTS;

type Props = {
    titleTop: string;
    titleBottom: string;
    icon: VariantKey;
    className?: string;
};

export default function InfoCard({ titleTop, titleBottom, icon, className }: Props) {
    const variant = VARIANTS[icon];
    const Icon = variant.Icon;

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
                    <Icon className="h-5 w-5" />
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
