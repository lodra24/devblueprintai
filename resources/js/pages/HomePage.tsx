import React, { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import InputFloat from "@/components/ui/InputFloat";
import TextareaFloat from "@/components/ui/TextareaFloat";
import ButtonEditorial from "@/components/ui/ButtonEditorial";
import InfoCard from "@/components/ui/InfoCard";
import { useCreateProject } from "@/hooks/useCreateProject";

export default function HomePage() {
    const [name, setName] = useState("");
    const [ideaText, setIdeaText] = useState("");
    const createProjectMutation = useCreateProject();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createProjectMutation.mutate({ name, idea_text: ideaText });
    };

    const isLoading = createProjectMutation.isPending;
    const errorMessage =
        (createProjectMutation.error as any)?.response?.data?.message ||
        createProjectMutation.error?.message;

    return (
        <main className="relative z-10 font-body text-ink">
            <div className="grain" />
            <div className="fixed inset-0 bg-minimal pointer-events-none" />

            <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight font-bold break-words">
                    MarketingBlueprint <span className="text-accent">AI</span>
                </h1>
                <p className="mt-6 text-stone text-lg md:text-xl tracking-wide font-light">
                    From Idea to Actionable Marketing Plan
                </p>

                <div className="relative mt-14 md:mt-16">
                    <GlassCard className="max-w-2xl mx-auto p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6 text-left">
                            <InputFloat
                                id="project-name"
                                label="Project Name"
                                inputProps={{
                                    type: "text",
                                    name: "name",
                                    value: name,
                                    required: true,
                                    disabled: isLoading,
                                    onChange: (event) => setName(event.target.value),
                                    placeholder: " ",
                                    autoComplete: "off",
                                }}
                            />

                            <div className="divider" />

                            <TextareaFloat
                                id="project-idea"
                                label="Your Project Idea"
                                rows={4}
                                textareaProps={{
                                    name: "idea_text",
                                    value: ideaText,
                                    required: true,
                                    disabled: isLoading,
                                    onChange: (event) => setIdeaText(event.target.value),
                                    placeholder: " ",
                                }}
                            />

                            {errorMessage && (
                                <p className="text-sm text-red-600 text-center" role="alert">
                                    {errorMessage}
                                </p>
                            )}

                            <ButtonEditorial
                                type="submit"
                                className="mt-6 disabled:opacity-60 disabled:pointer-events-none"
                                disabled={isLoading}
                            >
                                {isLoading ? "Generating..." : "Generate Blueprint"}
                            </ButtonEditorial>

                            <p className="hint-text">
                                e.g. "A new D2C skincare brand for women aged 18-30, aiming to grow
                                subscriptions in 90 days..."
                            </p>
                        </form>
                    </GlassCard>
                </div>

                <div className="mt-16 grid gap-3 sm:grid-cols-3 max-w-3xl mx-auto">
                    <InfoCard titleTop="Focus" titleBottom="Persona x Channel Fit" />
                    <InfoCard titleTop="Output" titleBottom="90-Day GTM Roadmap" />
                    <InfoCard titleTop="Deliverables" titleBottom="Campaign Calendar & KPIs" />
                </div>
            </section>
        </main>
    );
}
