// resources/js/api.ts

import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,

    // Laravel Sanctum'un cookie tabanlı kimlik doğrulaması için bu ayar gerekli.
    withCredentials: true,
});

export default api;
