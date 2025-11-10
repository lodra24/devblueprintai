import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import AuthFormCard from "@/components/auth/AuthFormCard";
import AuthToggle from "@/components/auth/AuthToggle";
import ButtonEditorial from "@/components/ui/ButtonEditorial";
import InputFloat from "@/components/ui/InputFloat";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthErrorMessage } from "@/lib/getAuthErrorMessage";
import { routeUrls } from "@/routes";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login } = useAuth();
    const loginMutation = useMutation({
        mutationFn: login,
    });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        loginMutation.reset();

        try {
            await loginMutation.mutateAsync({ email, password });
        } catch (mutationError) {
            console.error("Login failed:", mutationError);
        }
    };

    const errorMessage = loginMutation.error
        ? getAuthErrorMessage(loginMutation.error, "Invalid credentials.")
        : null;

    return (
        <main className="relative min-h-screen bg-frost text-ink">
            <div className="grain" />
            <div className="fixed inset-0 bg-minimal" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
                <AuthFormCard
                    title="Sign in"
                    subtitle="Pick up where you left off and continue refining your launch plan."
                    toggle={<AuthToggle active="login" />}
                    footer={
                        <p className="hint-text">
                            Need an account?{" "}
                            <Link to={routeUrls.register} className="text-accent">
                                Create one
                            </Link>
                        </p>
                    }
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputFloat
                            id="login-email"
                            label="Email address"
                            inputProps={{
                                type: "email",
                                name: "email",
                                autoComplete: "email",
                                required: true,
                                value: email,
                                onChange: (event) => setEmail(event.target.value),
                                disabled: loginMutation.isPending,
                            }}
                        />

                        <InputFloat
                            id="login-password"
                            label="Password"
                            inputProps={{
                                type: "password",
                                name: "password",
                                autoComplete: "current-password",
                                required: true,
                                value: password,
                                onChange: (event) => setPassword(event.target.value),
                                disabled: loginMutation.isPending,
                            }}
                        />

                        {errorMessage && (
                            <div
                                className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700"
                                role="alert"
                                aria-live="polite"
                            >
                                {errorMessage}
                            </div>
                        )}

                        <div className="space-y-3">
                            <ButtonEditorial
                                type="submit"
                                className="disabled:pointer-events-none disabled:opacity-60"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? "Signing in..." : "Sign in"}
                            </ButtonEditorial>
                            <p className="hint-text">
                                Forgot your password?{" "}
                                <a href="mailto:support@marketingblueprint.ai" className="text-accent">
                                    Contact support
                                </a>
                                .
                            </p>
                        </div>
                    </form>
                </AuthFormCard>
            </div>
        </main>
    );
};

export default LoginPage;
