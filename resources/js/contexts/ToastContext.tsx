import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

type ToastType = "info" | "success" | "error";

interface ShowToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextValue {
    showToast: (options: ShowToastOptions) => void;
}

interface ToastRecord {
    id: string;
    message: string;
    type: ToastType;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toastStyles: Record<ToastType, string> = {
    info: "bg-slate-800/90 text-white",
    success: "bg-emerald-600/90 text-white",
    error: "bg-rose-600/90 text-white",
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [toasts, setToasts] = useState<ToastRecord[]>([]);
    const timeoutHandles = useRef<Record<string, ReturnType<typeof setTimeout>>>(
        {}
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        if (timeoutHandles.current[id]) {
            clearTimeout(timeoutHandles.current[id]);
            delete timeoutHandles.current[id];
        }
    }, []);

    const showToast = useCallback(
        ({ message, type = "info", duration = 4000 }: ShowToastOptions) => {
            if (!message) {
                return;
            }

            const id = Math.random().toString(36).slice(2);
            setToasts((prev) => [...prev, { id, message, type }]);

            if (duration > 0) {
                timeoutHandles.current[id] = setTimeout(
                    () => removeToast(id),
                    duration
                );
            }
        },
        [removeToast]
    );

    useEffect(
        () => () => {
            Object.values(timeoutHandles.current).forEach(clearTimeout);
            timeoutHandles.current = {};
        },
        []
    );

    const contextValue = useMemo(
        () => ({
            showToast,
        }),
        [showToast]
    );

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div
                className="pointer-events-none fixed top-4 right-4 z-[1000] flex max-w-sm flex-col gap-3"
                aria-live="polite"
                role="status"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-start gap-3 rounded-md px-4 py-3 text-sm shadow-lg ring-1 ring-white/10 ${toastStyles[toast.type]}`}
                        role="alert"
                    >
                        <span className="flex-1 leading-5">{toast.message}</span>
                        <button
                            type="button"
                            aria-label="Dismiss notification"
                            className="text-white/80 transition hover:text-white"
                            onClick={() => removeToast(toast.id)}
                        >
                            X
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }

    return context;
};
