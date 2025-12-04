import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type AuthGuardControls = {
    /**
     * Wraps a protected action. Runs callback if authenticated,
     * otherwise runs optional onBlocked then opens the auth modal.
     * Returns true when the callback executed.
     */
    guard: (callback: () => void, onBlocked?: () => void) => boolean;
    isAuthModalOpen: boolean;
    closeAuthModal: () => void;
    canEdit: boolean;
};

export const useAuthGuard = (): AuthGuardControls => {
    const { user } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const guard = useCallback(
        (callback: () => void, onBlocked?: () => void) => {
            if (user) {
                callback();
                return true;
            }

            if (onBlocked) {
                onBlocked();
            }
            setIsAuthModalOpen(true);
            return false;
        },
        [user]
    );

    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
    }, []);

    const canEdit = useMemo(() => !!user, [user]);

    return {
        guard,
        isAuthModalOpen,
        closeAuthModal,
        canEdit,
    };
};
