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

const RegisterPage: React.FC = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [clientError, setClientError] = useState<string | null>(null);

    const { register } = useAuth();
    const registerMutation = useMutation({
        mutationFn: register,
    });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setClientError(null);
        registerMutation.reset();

        if (password !== passwordConfirmation) {
            setClientError("Passwords do not match.");
            return;
        }

        try {
            await registerMutation.mutateAsync({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
        } catch (mutationError) {
            console.error("Registration failed:", mutationError);
        }
    };

    const serverError = registerMutation.error
        ? getAuthErrorMessage(
              registerMutation.error,
              "An error occurred during registration."
          )
        : null;
    const errorMessage = clientError ?? serverError;

    return (
        <main className="relative min-h-screen bg-frost text-ink">
            <div className="grain" />
            <div className="fixed inset-0 bg-minimal" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
                <AuthFormCard
                    title="Create an account"
                    subtitle="Launch with confidence—save briefs, channel plans, and KPIs inside one workspace."
                    toggle={<AuthToggle active="register" />}
                    footer={
                        <p className="hint-text">
                            Already onboard?{" "}
                            <Link to={routeUrls.login} className="text-accent">
                                Sign in
                            </Link>
                            .
                        </p>
                    }
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputFloat
                            id="register-name"
                            label="Full name"
                            inputProps={{
                                type: "text",
                                name: "name",
                                autoComplete: "name",
                                required: true,
                                value: name,
                                onChange: (event) => setName(event.target.value),
                                disabled: registerMutation.isPending,
                            }}
                        />

                        <InputFloat
                            id="register-email"
                            label="Work email"
                            inputProps={{
                                type: "email",
                                name: "email",
                                autoComplete: "email",
                                required: true,
                                value: email,
                                onChange: (event) => setEmail(event.target.value),
                                disabled: registerMutation.isPending,
                            }}
                        />

                        <InputFloat
                            id="register-password"
                            label="Password"
                            inputProps={{
                                type: "password",
                                name: "password",
                                autoComplete: "new-password",
                                required: true,
                                value: password,
                                onChange: (event) => setPassword(event.target.value),
                                disabled: registerMutation.isPending,
                            }}
                        />

                        <InputFloat
                            id="register-password-confirmation"
                            label="Confirm password"
                            inputProps={{
                                type: "password",
                                name: "password_confirmation",
                                autoComplete: "new-password",
                                required: true,
                                value: passwordConfirmation,
                                onChange: (event) =>
                                    setPasswordConfirmation(event.target.value),
                                disabled: registerMutation.isPending,
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

                        <ButtonEditorial
                            type="submit"
                            className="disabled:pointer-events-none disabled:opacity-60"
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending
                                ? "Creating account..."
                                : "Create account"}
                        </ButtonEditorial>
                    </form>
                </AuthFormCard>
            </div>
        </main>
    );
};

export default RegisterPage;
