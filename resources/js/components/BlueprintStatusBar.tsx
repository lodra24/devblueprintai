import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { ProjectStatus } from "@/types";
import { useSmoothProgress } from "@/hooks/useSmoothProgress";

type BlueprintStatusBarProps = {
    status: ProjectStatus;
    progress: number | null | undefined;
    stage?: string | null;
    message?: string | null;
    onRetry?: () => void;
    isRetrying?: boolean;
    projectId?: string;
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
        description: "AI is drafting the overall product scope...",
        tone: "info",
    },
    parsing: {
        title: "Structuring details",
        description: "Organising epics and user stories from the AI output...",
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

const SuccessIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M7.75 12L10.58 14.83L16.25 9.17"
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
    projectId,
}) => {
    const showProgress = ["generating", "parsing", "ready"].includes(status);
    const isReady = status === "ready";

    const smoothProgress = useSmoothProgress(
        progress,
        showProgress,
        projectId
    );

    useEffect(() => {
        if (!isReady) {
            return;
        }

        const count = 200;
        const defaults = { origin: { y: 0.7 } };

        const fire = (particleRatio: number, opts: Record<string, unknown>) => {
            void confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        };

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }, [isReady]);

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

    const displayPercent = isReady
        ? 100
        : Math.min(Math.floor(smoothProgress), 99);
    const barWidth = isReady ? 100 : smoothProgress;

    const containerClasses = isReady
        ? "border-emerald-500/30 bg-emerald-50/50 shadow-emerald-100 scale-[1.01]"
        : styles.container;

    const accentClasses = isReady
        ? "bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]"
        : styles.accent;

    const showRetryButton = status === "failed" && typeof onRetry === "function";

    return (
        <section
            role="status"
            aria-live="polite"
            className={`surface-panel surface-panel--muted mt-6 px-5 py-6 transition-all duration-500 ${containerClasses}`}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <p
                        className={`text-xs font-semibold uppercase tracking-[0.3em] transition-colors ${
                            isReady ? "text-emerald-600/80" : "text-stone/70"
                        }`}
                    >
                        {isReady ? "COMPLETE" : "Blueprint status"}
                    </p>
                    <h2 className="font-display text-xl font-semibold text-ink">
                        {isReady ? "Blueprint successfully created" : copy.title}
                    </h2>
                    <p className="text-sm text-stone">{copy.description}</p>
                </div>
                {(showProgress || showRetryButton) && (
                    <div className="flex items-center gap-3">
                        {showProgress && (
                            <div
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-500 ${
                                    isReady
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-white/85 text-ink/80"
                                }`}
                            >
                                {isReady ? (
                                    <span className="flex items-center gap-2 animate-pop">
                                        <SuccessIcon className="h-4 w-4" />
                                        Done
                                    </span>
                                ) : (
                                    <>
                                        <span>Progress</span>
                                        <span className="min-w-[3ch] text-right tabular-nums">
                                            {displayPercent}%
                                        </span>
                                    </>
                                )}
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
                        className={`relative h-full rounded-full ${accentClasses}`}
                        style={{
                            width: `${barWidth}%`,
                            transition: "none",
                        }}
                    >
                        {isReady && (
                            <div className="absolute inset-0 h-full w-full animate-[shimmer_1.5s_infinite]">
                                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]" />
                            </div>
                        )}
                    </div>
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
