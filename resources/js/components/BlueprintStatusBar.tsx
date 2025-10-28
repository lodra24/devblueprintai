import React from "react";
import { ProjectStatus } from "@/types";

type BlueprintStatusBarProps = {
    status: ProjectStatus;
    progress: number | null | undefined;
    stage?: string | null;
    message?: string | null;
};

const clampProgress = (value: number | null | undefined): number => {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return 0;
    }

    return Math.min(Math.max(value, 0), 100);
};

const toneStyles: Record<
    "info" | "success" | "danger",
    { container: string; accent: string }
> = {
    info: {
        container:
            "border-sky-700/60 bg-sky-900/40 text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.12)]",
        accent: "bg-sky-500",
    },
    success: {
        container:
            "border-emerald-700/60 bg-emerald-900/40 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.15)]",
        accent: "bg-emerald-400",
    },
    danger: {
        container:
            "border-rose-700/70 bg-rose-950/60 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.18)]",
        accent: "bg-rose-500",
    },
};

const statusCopy: Record<
    ProjectStatus,
    { title: string; description?: string; tone: "info" | "success" | "danger" }
> = {
    pending: {
        title: "Queued for generation",
        description: "We'll start crafting your blueprint momentarily.",
        tone: "info",
    },
    generating: {
        title: "Generating blueprint",
        description: "AI is drafting the overall product scope.",
        tone: "info",
    },
    parsing: {
        title: "Structuring details",
        description: "Organising epics and user stories from the AI output.",
        tone: "info",
    },
    ready: {
        title: "Blueprint ready",
        description: "Drag cards to refine the plan or iterate with AI again.",
        tone: "success",
    },
    failed: {
        title: "Generation failed",
        description: "You can try again or tweak your idea before retrying.",
        tone: "danger",
    },
};

const stageCopy: Record<string, { title: string; description?: string }> = {
    generating: {
        title: "Thinking through the idea",
        description: "Gathering requirements and outlining the blueprint.",
    },
    parsing: {
        title: "Cleaning up AI output",
        description: "Validating and normalising epics, stories, and schema suggestions.",
    },
    ready: {
        title: "Blueprint ready",
        description: "Everything is synced. Start prioritising your backlog.",
    },
    failed: {
        title: "Generation failed",
        description: "We hit an error while producing the blueprint.",
    },
};

const BlueprintStatusBar: React.FC<BlueprintStatusBarProps> = ({
    status,
    progress,
    stage,
    message,
}) => {
    const baseCopy = statusCopy[status];
    const overrideCopy =
        stage && stageCopy[stage.toLowerCase()] ? stageCopy[stage.toLowerCase()] : undefined;

    const copy = overrideCopy
        ? {
              title: overrideCopy.title,
              description: overrideCopy.description ?? baseCopy.description,
              tone: baseCopy.tone,
          }
        : baseCopy;

    const tone = copy.tone;
    const styles = toneStyles[tone];

    const showProgress = ["generating", "parsing"].includes(status);
    const currentProgress = clampProgress(progress);
    return (
        <section
            role="status"
            aria-live="polite"
            className={`mt-6 rounded-xl border px-4 py-4 transition-all duration-300 ${styles.container}`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                        Blueprint status
                    </p>
                    <h2 className="text-lg font-semibold">{copy.title}</h2>
                    <p className="mt-1 text-sm text-white/70">
                        {copy.description}
                    </p>
                </div>
                {showProgress && (
                    <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                        <span>{currentProgress}%</span>
                    </div>
                )}
            </div>

            {showProgress && (
                <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${styles.accent}`}
                        style={{ width: `${currentProgress}%` }}
                    />
                </div>
            )}

            {message && (
                <p
                    className={`mt-3 text-sm font-medium ${
                        tone === "danger" ? "text-rose-100" : "text-white/80"
                    }`}
                >
                    {message}
                </p>
            )}
        </section>
    );
};

export default BlueprintStatusBar;
