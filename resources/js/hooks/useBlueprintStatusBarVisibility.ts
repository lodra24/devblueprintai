import { useEffect, useState } from "react";
import { ProjectStatus } from "@/types";

const READY_SEEN_KEY_PREFIX = "blueprintReadySeen:";

const getStorageKey = (projectId: string) =>
    `${READY_SEEN_KEY_PREFIX}${projectId}`;

export const useBlueprintStatusBarVisibility = (
    projectId?: string | null,
    status?: ProjectStatus
) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!status) {
            setIsVisible(false);
            return;
        }

        if (status !== "ready") {
            setIsVisible(true);
            return;
        }

        if (!projectId || typeof window === "undefined") {
            setIsVisible(true);
            return;
        }

        const storageKey = getStorageKey(projectId);

        const hasSeenReadyState =
            window.localStorage.getItem(storageKey) === "1";

        if (hasSeenReadyState) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);
        window.localStorage.setItem(storageKey, "1");

        const timeoutId = window.setTimeout(() => {
            setIsVisible(false);
        }, 5000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [projectId, status]);

    return isVisible;
};
