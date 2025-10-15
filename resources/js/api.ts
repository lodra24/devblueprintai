import { http, ensureCsrf } from "./lib/http";
import { AxiosError } from "axios";

// --- Proje Endpoint'leri ---

export const createProject = async (data: { name: string; prompt: string }) => {
    await ensureCsrf();
    const response = await http.post("/projects", data);
    // Genellikle Laravel API resource'ları veriyi bir 'data' anahtarı içinde sarmalar.
    // Burada doğrudan response.data'yı dönerek React Query'nin işini kolaylaştırıyoruz.
    return response.data;
};

export const getProject = async (projectId: string) => {
    const response = await http.get(`/projects/${projectId}`);
    return response.data;
};

export const claimProject = async (projectId: string) => {
    await ensureCsrf();
    const response = await http.post("/projects/claim", {
        project_id: projectId,
    });
    return response.data;
};

// --- Kimlik Doğrulama Endpoint'leri ---

export const getUser = async () => {
    try {
        const response = await http.get("/user");
        return response.data;
    } catch (error) {
        // Eğer hata bir Axios hatası ise ve durumu 401 ise, bu beklenen bir durum
        // (kullanıcı giriş yapmamış). Bu durumda null dönerek "kullanıcı yok" diyoruz.
        if (error instanceof AxiosError && error.response?.status === 401) {
            return null;
        }

        // Diğer tüm hataları (500, network hatası vb.) tekrar fırlat.
        // Bu, React Query'nin 'error' durumuna geçmesini ve 'retry' mantığını
        // çalıştırmasını sağlar.
        throw error;
    }
};

export const login = async (credentials: any) => {
    await ensureCsrf();
    const response = await http.post("/login", credentials);
    return response.data;
};

export const register = async (userData: any) => {
    await ensureCsrf();
    const response = await http.post("/register", userData);
    return response.data;
};

export const logout = async () => {
    await ensureCsrf();
    const response = await http.post("/logout");
    return response.data;
};
