import { useCallback, useEffect, useState } from "react";

export function useRowMenu() {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        if (!openMenuId) {
            return;
        }

        const handleClickAway = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest("[data-menu-root]")) {
                return;
            }
            setOpenMenuId(null);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpenMenuId(null);
            }
        };

        document.addEventListener("click", handleClickAway);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("click", handleClickAway);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [openMenuId]);

    const toggleMenu = useCallback((id: string) => {
        setOpenMenuId((current) => (current === id ? null : id));
    }, []);

    const closeMenu = useCallback(() => {
        setOpenMenuId(null);
    }, []);

    const isMenuOpen = useCallback(
        (id: string) => openMenuId === id,
        [openMenuId]
    );

    return {
        openMenuId,
        isMenuOpen,
        toggleMenu,
        closeMenu,
    };
}
