import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import {
    getUser,
    login as apiLogin,
    register as apiRegister,
    logout as apiLogout,
    claimProject,
    type AuthUser,
    type LoginPayload,
    type RegisterPayload,
} from "@/api";
import { ensureCsrf } from "@/lib/http";
import { GUEST_PROJECT_ID_KEY } from "@/constants";
import { routeUrls } from "@/routes";

interface AuthContextType {
    user: AuthUser | null;
    isAuthLoading: boolean;
    register: (data: RegisterPayload) => Promise<void>;
    login: (data: LoginPayload) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUser = useCallback(async (signal?: AbortSignal) => {
        try {
            const userData = await getUser({ signal });
            if (!signal?.aborted) {
                setUser(userData);
            }
        } catch (error) {
            if (!signal?.aborted) {
                setUser(null);
            }
            console.error("Not authenticated or failed to fetch user.");
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const initializeAuth = async () => {
            try {
                await ensureCsrf();
            } catch (error) {
                console.error("Failed to fetch CSRF cookie:", error);
            } finally {
                await fetchUser(controller.signal);
                if (!controller.signal.aborted) {
                    setIsAuthLoading(false);
                }
            }
        };

        void initializeAuth();

        return () => {
            controller.abort();
        };
    }, [fetchUser]);

    const handlePostAuth = useCallback(async () => {
        const guestProjectId = localStorage.getItem(GUEST_PROJECT_ID_KEY);

        if (guestProjectId) {
            try {
                await claimProject(guestProjectId);
                localStorage.removeItem(GUEST_PROJECT_ID_KEY);
                navigate(routeUrls.blueprint(guestProjectId), {
                    state: { claimed: true },
                });
                return;
            } catch (claimError) {
                console.error("Failed to claim project:", claimError);
                localStorage.removeItem(GUEST_PROJECT_ID_KEY);
            }
        }
        navigate(routeUrls.home);
    }, [navigate]);

    const register = useCallback(
        async (data: RegisterPayload) => {
            await apiRegister(data);
            await fetchUser();
            await handlePostAuth();
        },
        [fetchUser, handlePostAuth]
    );

    const login = useCallback(
        async (data: LoginPayload) => {
            await apiLogin(data);
            await fetchUser();
            await handlePostAuth();
        },
        [fetchUser, handlePostAuth]
    );

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            setUser(null);
            navigate(routeUrls.home);
        }
    }, [navigate]);

    const value = useMemo(
        () => ({
            user,
            isAuthLoading,
            register,
            login,
            logout,
        }),
        [user, isAuthLoading, register, login, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {!isAuthLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
