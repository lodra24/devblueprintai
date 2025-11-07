import React from "react";
import clsx from "clsx";

type Props = React.PropsWithChildren<{ className?: string }>;

export default function GlassCard({ className, children }: Props) {
    return <div className={clsx("glass-card", className)}>{children}</div>;
}
