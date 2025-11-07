/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                display: ["Sora", "Inter", "system-ui", "sans-serif"],
                body: ["Inter", "system-ui", "sans-serif"],
            },
            colors: {
                ink: { DEFAULT: "#0F172A" },
                stone: { DEFAULT: "#78716C" },
                frost: { DEFAULT: "#F5F3F0" },
                accent: { DEFAULT: "#6366F1" },
            },
            boxShadow: {
                glass: "0 8px 24px rgba(15,23,42,.08), inset 0 1px 1px rgba(255,255,255,.2)",
                deep: "0 20px 50px rgba(15,23,42,.12)",
            },
            backgroundImage: {
                minimal: "linear-gradient(180deg, rgba(99,102,241,.04) 0%, transparent 50%)",
                grain: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")",
            },
            keyframes: {
                glow: {
                    "0%,100%": { opacity: "0.6" },
                    "50%": { opacity: "1" },
                },
                fade: {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                shimmer: {
                    "0%": { left: "-100%" },
                    "100%": { left: "100%" },
                },
            },
            animation: {
                glow: "glow 3s ease-in-out infinite",
                fade: "fade 0.4s ease",
                shimmer: "shimmer 2s infinite",
            },
        },
    },
    plugins: [],
};
