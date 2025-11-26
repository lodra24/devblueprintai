import { useEffect, useRef, useState } from "react";
import {
    SMOOTH_PROGRESS_FINISH_RATE,
    SMOOTH_PROGRESS_MIN_TRICKLE,
    SMOOTH_PROGRESS_SPEED_FACTOR,
} from "@/constants";

export const useSmoothProgress = (
    backendProgress: number | null | undefined,
    isActive: boolean = true,
    resetKey?: string | number
) => {
    const [displayProgress, setDisplayProgress] = useState(0);

    const targetRef = useRef(0);
    const lastUpdateTimeRef = useRef<number>();
    const animationFrameRef = useRef<number>();
    const previousResetKeyRef = useRef(resetKey);

    useEffect(() => {
        const progress = backendProgress ?? 0;
        let newTarget = 0;

        if (progress === 100) {
            newTarget = 100;
        } else if (progress >= 90) {
            newTarget = 99;
        } else if (progress >= 50) {
            newTarget = 98;
        } else if (progress >= 10) {
            newTarget = 95;
        } else {
            newTarget = Math.max(progress, 5);
        }

        const keyChanged = resetKey !== previousResetKeyRef.current;
        const significantDrop = newTarget < targetRef.current;

        if (keyChanged || significantDrop) {
            setDisplayProgress(0);
            previousResetKeyRef.current = resetKey;
        }

        targetRef.current = newTarget;
    }, [backendProgress, resetKey]);

    useEffect(() => {
        if (typeof window === "undefined" || !isActive) {
            return;
        }

        const animate = (time: number) => {
            if (lastUpdateTimeRef.current !== undefined) {
                const deltaTime = time - lastUpdateTimeRef.current;

                setDisplayProgress((prev) => {
                    const target = targetRef.current;

                    if (target === 100) {
                        if (prev >= 100) {
                            return 100;
                        }
                        const finishStep = SMOOTH_PROGRESS_FINISH_RATE * deltaTime;
                        return Math.min(prev + finishStep, 100);
                    }

                    const distance = target - prev;
                    let step =
                        distance * SMOOTH_PROGRESS_SPEED_FACTOR * deltaTime;
                    const minTrickle = SMOOTH_PROGRESS_MIN_TRICKLE * deltaTime;

                    if (step < minTrickle) {
                        step = minTrickle;
                    }

                    let nextProgress = prev + step;

                    if (nextProgress > 99) {
                        nextProgress = 99;
                    }

                    return nextProgress;
                });
            }

            lastUpdateTimeRef.current = time;
            animationFrameRef.current = window.requestAnimationFrame(animate);
        };

        animationFrameRef.current = window.requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current !== undefined) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }
            lastUpdateTimeRef.current = undefined;
        };
    }, [isActive]);

    return displayProgress;
};
