import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

// Sadece 5xx sunucu hataları veya network hataları için yeniden deneme yap.
// 4xx istemci hatalarında (örn: 404 Not Found, 403 Forbidden) yeniden deneme yapma,
// çünkü bu hataların tekrar denemeyle düzelme ihtimali düşüktür.
const retry = (failureCount: number, error: unknown): boolean => {
    // 3 denemeden sonra vazgeç
    if (failureCount >= 3) {
        return false;
    }

    if (error instanceof AxiosError) {
        // Network hatası (sunucuya ulaşılamadı)
        if (!error.response) {
            return true;
        }

        // 5xx sunucu hatalarında yeniden dene
        if (error.response.status >= 500 && error.response.status <= 599) {
            return true;
        }
    }

    // Diğer tüm durumlarda (4xx hataları dahil) yeniden deneme
    return false;
};

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Verinin "bayat" (stale) olarak kabul edileceği süre.
            // Bu süre dolana kadar veri önbellekten okunur, ağ isteği yapılmaz.
            staleTime: 30 * 1000, // 30 saniye

            // Verinin kullanılmadığında (inactive) ne kadar süre önbellekte tutulacağı.
            // Garbage Collection Time.
            gcTime: 5 * 60 * 1000, // 5 dakika

            // Hata durumunda yeniden deneme mantığı
            retry,

            // Kullanıcı pencereye tekrar odaklandığında veriyi yeniden çekme ayarı.
            // Geliştirme ortamında sürekli veri çekmesini önlemek için kapalı, production'da açık.
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
        },
    },
});
