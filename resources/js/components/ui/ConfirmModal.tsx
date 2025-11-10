import React, { useEffect } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    open: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

const ConfirmModal = ({
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    open,
    loading,
    onConfirm,
    onCancel,
}: ConfirmModalProps) => {
    useEffect(() => {
        if (!open) {
            return;
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onCancel();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onCancel]);

    if (!open) {
        return null;
    }

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:py-0">
            <div
                className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-fade"
                onClick={onCancel}
            />
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-stone/15 bg-white p-6 shadow-deep animate-pop">
                <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
                <p className="mt-3 text-sm text-stone">{description}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="w-full rounded-xl border border-stone/30 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-stone/10 sm:w-auto"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:pointer-events-none sm:w-auto"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Deleting…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ConfirmModal;
