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
                {/* Updated headline */}
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight font-bold break-words">
                    Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-indigo-500">Prism</span>.<br />
                    Your AI Marketing Architect.
                </h1>

                <p className="mt-6 text-stone text-lg md:text-xl tracking-wide font-light max-w-3xl mx-auto">
                    Instantly generate a structured board of psychological hooks, ad copy, and persona insights. From blank page to ready-to-test assets in seconds.
                </p>

                <div className="relative mt-14 md:mt-16">
                    <GlassCard className="max-w-2xl mx-auto p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6 text-left">
                            <InputFloat
                                id="project-name"
                                label="Brand or Project Name"
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
                                label="Product & Market Context"
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
                                {isLoading ? "Generating Blueprint..." : "Generate Marketing Blueprint"}
                            </ButtonEditorial>

                            {/* Updated input hint */}
                            <p className="hint-text">
                                e.g. "A new D2C skincare brand for women aged 30+, focusing on anti-aging with natural ingredients. Tone: Scientific but accessible."
                            </p>
                        </form>
                    </GlassCard>
                </div>

                <div className="mt-20 grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
                    <InfoCard icon="strategy" titleTop="STRATEGY" titleBottom="Psychological Angles" />
                    <InfoCard icon="assets" titleTop="ASSETS" titleBottom="Hooks, Headlines & CTAs" />
                    <InfoCard icon="insights" titleTop="INSIGHTS" titleBottom="Persona Deep-Dive" />
                </div>
            </section>
        </main>
    );
}
