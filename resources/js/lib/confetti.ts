type TriggerConfettiOptions = {
    /** Optional guard to skip firing when caller has been cancelled/unmounted */
    isCancelled?: () => boolean;
};

type ConfettiFn = typeof import("canvas-confetti");

let confettiLoader: Promise<ConfettiFn> | null = null;

const loadConfetti = () => {
    if (!confettiLoader) {
        confettiLoader = import("canvas-confetti").then((module) => {
            const maybeDefault = (module as { default?: unknown }).default;
            return (maybeDefault ?? module) as ConfettiFn;
        });
    }
    return confettiLoader;
};

export const triggerConfetti = async (options?: TriggerConfettiOptions) => {
    const isCancelled = options?.isCancelled ?? (() => false);
    const confetti = await loadConfetti();

    if (isCancelled()) {
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
};
