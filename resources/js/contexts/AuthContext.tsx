import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Axios için varsayılan ayarlar
axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://devblueprint.test";

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
            const response = await axios.get("/api/user");
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    // Kayıt fonksiyonu
    const register = async (data: any) => {
        await axios.get("/sanctum/csrf-cookie");
        await axios.post("/register", data);
        await fetchUser(); // Kullanıcı bilgisini güncelle
        navigate("/"); // Ana sayfaya yönlendir
    };

    // Giriş fonksiyonu
    const login = async (data: any) => {
        await axios.get("/sanctum/csrf-cookie");
        await axios.post("/login", data);
        await fetchUser(); // Kullanıcı bilgisini güncelle
        navigate("/"); // Ana sayfaya yönlendir
    };

    // Çıkış fonksiyonu
    const logout = async () => {
        await axios.post("/logout");
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

    // AuthContext'i sarmalayan ana bileşen için `BrowserRouter`'a ihtiyacımız var.
    // Bunu app.tsx'de bırakmak daha doğru. Bu yüzden buradaki BrowserRouter'ı kaldırıyoruz.
    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

// Hook'u güncelliyoruz, artık `useNavigate` içeride tanımlanmayacak.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
