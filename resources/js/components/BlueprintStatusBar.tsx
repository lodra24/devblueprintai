import React from "react";
import { ProjectStatus } from "@/types";

type BlueprintStatusBarProps = {
    status: ProjectStatus;
    progress: number | null | undefined;
    stage?: string | null;
    message?: string | null;
    onRetry?: () => void;
    isRetrying?: boolean;
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

const RetryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M3 8.5V4h4.5"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M21 15.5V20h-4.5"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M20 9a8 8 0 0 0-13.657-4.95L3 7.5"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4 15a8 8 0 0 0 13.657 4.95L21 16.5"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const BlueprintStatusBar: React.FC<BlueprintStatusBarProps> = ({
    status,
    progress,
    stage,
    message,
    onRetry,
    isRetrying = false,
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
    const showRetryButton = status === "failed" && typeof onRetry === "function";

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
                {(showProgress || showRetryButton) && (
                    <div className="flex items-center gap-3">
                        {showProgress && (
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-ink/80 shadow-sm">
                                <span>Progress</span>
                                <span>{currentProgress}%</span>
                            </div>
                        )}
                        {showRetryButton && (
                            <button
                                type="button"
                                onClick={onRetry}
                                disabled={isRetrying}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-white/90 text-rose-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label={
                                    isRetrying
                                        ? "Retrying blueprint generation"
                                        : "Retry blueprint generation"
                                }
                            >
                                <RetryIcon
                                    className={`h-5 w-5 ${
                                        isRetrying ? "animate-spin" : ""
                                    }`}
                                />
                            </button>
                        )}
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
