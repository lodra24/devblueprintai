import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // axios yerine merkezi api istemcisini import et
import { GUEST_PROJECT_ID_KEY } from "../constants"; // Sabiti import et

// Kullanıcı objesinin tipi
interface User {
    id: number;
    name: string;
    email: string;
}

// Auth Context'in sağlayacağı değerlerin ve fonksiyonların tipleri
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    register: (data: any) => Promise<void>;
    login: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Kullanıcıyı getiren fonksiyon
    const fetchUser = async () => {
        try {
            const response = await api.get("/api/user"); // axios -> api
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        api.get("/sanctum/csrf-cookie").then(() => {
            // axios -> api
            fetchUser();
        });
    }, []);

    // Giriş veya kayıt sonrası çalışacak ortak fonksiyon
    const handlePostAuth = async () => {
        const guestProjectId = localStorage.getItem(GUEST_PROJECT_ID_KEY);

        if (guestProjectId) {
            try {
                await api.post("/api/projects/claim", {
                    project_id: guestProjectId,
                });
                localStorage.removeItem(GUEST_PROJECT_ID_KEY);
                navigate(`/blueprint/${guestProjectId}`);
                return;
            } catch (claimError) {
                console.error("Failed to claim project:", claimError);
                localStorage.removeItem(GUEST_PROJECT_ID_KEY);
                navigate("/");
                return;
            }
        }

        navigate("/");
    };

    // Kayıt fonksiyonu
    const register = async (data: any) => {
        await api.post("/register", data);
        await fetchUser();
        await handlePostAuth();
    };

    // Giriş fonksiyonu
    const login = async (data: any) => {
        await api.post("/login", data);
        await fetchUser();
        await handlePostAuth();
    };

    // Çıkış fonksiyonu
    const logout = async () => {
        await api.post("/logout");
        setUser(null);
        navigate("/");
    };

    const value = {
        user,
        isLoading,
        register,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
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
