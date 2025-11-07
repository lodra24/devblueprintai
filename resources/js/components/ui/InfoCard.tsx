import React from "react";
import GlassCard from "./GlassCard";

type Props = { titleTop: string; titleBottom: string };

export default function InfoCard({ titleTop, titleBottom }: Props) {
    return (
        <GlassCard className="p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone/70">
                {titleTop}
            </p>
            <p className="font-semibold text-sm mt-2">{titleBottom}</p>
        </GlassCard>
    );
}
