import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import HomePage from "./pages/HomePage";
import BlueprintPage from "./pages/BlueprintPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { AuthProvider } from "./contexts/AuthContext";
import { queryClient } from "./lib/queryClient";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/blueprint/:projectId"
                        element={<BlueprintPage />}
                    />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <App />
                {import.meta.env.DEV && (
                    <ReactQueryDevtools initialIsOpen={false} />
                )}
            </QueryClientProvider>
        </React.StrictMode>
    );
}
