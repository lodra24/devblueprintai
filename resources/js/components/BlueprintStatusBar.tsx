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
    { container: string; accent: string; message: string }
> = {
    info: {
        container: "border-accent/30",
        accent: "bg-accent",
        message: "text-accent/80",
    },
    success: {
        container: "border-emerald-200",
        accent: "bg-emerald-400",
        message: "text-emerald-700",
    },
    danger: {
        container: "border-rose-200",
        accent: "bg-rose-500",
        message: "text-rose-700",
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
            className={`surface-panel surface-panel--muted mt-6 px-5 py-6 transition-all duration-300 ${styles.container}`}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone/70">
                        Blueprint status
                    </p>
                    <h2 className="font-display text-xl font-semibold text-ink">
                        {copy.title}
                    </h2>
                    <p className="text-sm text-stone">{copy.description}</p>
                </div>
                {showProgress && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-ink/80 shadow-sm">
                        <span>Progress</span>
                        <span>{currentProgress}%</span>
                    </div>
                )}
            </div>

            {showProgress && (
                <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-stone/20">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${styles.accent}`}
                        style={{ width: `${currentProgress}%` }}
                    />
                </div>
            )}

            {message && (
                <p
                    className={`mt-4 text-sm font-medium ${styles.message}`}
                >
                    {message}
                </p>
            )}
        </section>
    );
};

export default BlueprintStatusBar;
