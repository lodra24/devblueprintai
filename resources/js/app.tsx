import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import BlueprintPage from "./pages/BlueprintPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { queryClient } from "./lib/queryClient";
import { routePaths } from "@/routes";

function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <Layout>
                        <Routes>
                            <Route path={routePaths.home} element={<HomePage />} />
                            <Route
                                path={routePaths.blueprint}
                                element={<BlueprintPage />}
                            />
                            <Route path={routePaths.login} element={<LoginPage />} />
                            <Route
                                path={routePaths.register}
                                element={<RegisterPage />}
                            />
                            <Route
                                path={routePaths.dashboard}
                                element={<DashboardPage />}
                            />
                        </Routes>
                    </Layout>
                </AuthProvider>
            </ToastProvider>
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
