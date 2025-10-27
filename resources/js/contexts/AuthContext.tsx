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
} from "@/api";
import { ensureCsrf } from "@/lib/http";
import { GUEST_PROJECT_ID_KEY } from "@/constants";
import { routeUrls } from "@/routes";

interface User {
    id: number;
    name: string;
    email: string;
}

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

interface LoginPayload {
    email: string;
    password: string;
    remember?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthLoading: boolean;
    register: (data: RegisterPayload) => Promise<void>;
    login: (data: LoginPayload) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUser = useCallback(async (isMountedChecker: () => boolean) => {
        try {
            const userData = await getUser();
            if (isMountedChecker()) {
                setUser(userData);
            }
        } catch (error) {
            if (isMountedChecker()) {
                setUser(null);
            }
            console.error("Not authenticated or failed to fetch user.");
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const isMountedChecker = () => isMounted;

        const initializeAuth = async () => {
            try {
                await ensureCsrf();
            } catch (error) {
                console.error("Failed to fetch CSRF cookie:", error);
            } finally {
                await fetchUser(isMountedChecker);
                if (isMounted) {
                    setIsAuthLoading(false);
                }
            }
        };

        void initializeAuth();

        return () => {
            isMounted = false;
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
            await fetchUser(() => true);
            await handlePostAuth();
        },
        [fetchUser, handlePostAuth]
    );

    const login = useCallback(
        async (data: LoginPayload) => {
            await apiLogin(data);
            await fetchUser(() => true);
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
