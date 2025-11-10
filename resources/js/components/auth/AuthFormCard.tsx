import React from "react";
import clsx from "clsx";

import GlassCard from "@/components/ui/GlassCard";

type Props = React.PropsWithChildren<{
    title: string;
    subtitle: string;
    toggle?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}>;

export default function AuthFormCard({
    title,
    subtitle,
    toggle,
    children,
    footer,
    className,
}: Props) {
    return (
        <GlassCard
            className={clsx(
                "w-full max-w-md px-6 py-8 shadow-deep sm:px-8 animate-authRise",
                className
            )}
        >
            {toggle && (
                <div className="mb-6 flex items-center justify-center">
                    {toggle}
                </div>
            )}

            <div className="space-y-3 text-center">
                <div className="mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-pastel-lilac via-accent/40 to-pastel-mint" />
                <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
                <p className="text-sm text-stone">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-6">{footer}</div>}
        </GlassCard>
    );
}
