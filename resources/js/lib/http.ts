import axios from "axios";

/**
 * API istekleri için yapılandırılmış Axios instance'ı.
 * - baseURL: Tüm isteklerin başına '/api' ekler.
 * - withCredentials: Sanctum'un cookie tabanlı kimlik doğrulaması için gereklidir.
 *                    Cross-origin (farklı domain/port) isteklerde tarayıcının cookie göndermesini sağlar.
 */
export const http = axios.create({
    baseURL: "/api",
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});

/**
 * State değiştiren (POST, PUT, PATCH, DELETE) bir istek göndermeden önce
 * Sanctum'dan CSRF cookie'sini aldığımızdan emin olur.
 */
export const ensureCsrf = () => {
    // Bu istek için baseURL'i geçersiz kılıyoruz çünkü CSRF endpoint'i '/api' altında değil, kök dizinde.
    return http.get("/sanctum/csrf-cookie", {
        baseURL: "/",
    });
};
