import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { GUEST_PROJECT_ID_KEY } from "../constants";

// --- Tip Tanımlamaları ---
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

// --- Context Oluşturma ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Bileşeni ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const navigate = useNavigate();

    // fetchUser fonksiyonunu, component'in mount durumunu kontrol edecek şekilde güncelledik.
    const fetchUser = useCallback(async (isMountedChecker: () => boolean) => {
        try {
            const response = await api.get("/api/user");
            if (isMountedChecker()) {
                setUser(response.data);
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
                await api.get("/sanctum/csrf-cookie");
            } catch (error) {
                console.error("Failed to fetch CSRF cookie:", error);
            } finally {
                // fetchUser'a bayrağı kontrol edecek fonksiyonu iletiyoruz.
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
                await api.post("/api/projects/claim", {
                    project_id: guestProjectId,
                });
                localStorage.removeItem(GUEST_PROJECT_ID_KEY);
                navigate(`/blueprint/${guestProjectId}`, {
                    state: { claimed: true },
                });
                return;
            } catch (claimError) {
                console.error("Failed to claim project:", claimError);
                localStorage.removeItem(GUEST_PROJECT_ID_KEY);
            }
        }
        navigate("/");
    }, [navigate]);

    const register = useCallback(
        async (data: RegisterPayload) => {
            await api.post("/api/register", data);
            await fetchUser(() => true); // Bu aşamada component'in mount olduğunu varsayabiliriz.
            await handlePostAuth();
        },
        [fetchUser, handlePostAuth]
    );

    const login = useCallback(
        async (data: LoginPayload) => {
            await api.post("/api/login", data);
            await fetchUser(() => true); // Bu aşamada component'in mount olduğunu varsayabiliriz.
            await handlePostAuth();
        },
        [fetchUser, handlePostAuth]
    );

    const logout = useCallback(async () => {
        try {
            await api.post("/api/logout");
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            setUser(null);
            navigate("/");
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

// --- Hook ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
