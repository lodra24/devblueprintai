import React from "react";
import { Project } from "@/types";

type SchemaPanelProps = {
    project: Project;
};

const SchemaPanel: React.FC<SchemaPanelProps> = ({ project }) => {
    const schemas = project.schema_suggestions ?? [];
    const telemetry = project.telemetry;
    const metrics = project.metrics;

    const hasSchemas = schemas.length > 0;
    const warnings = telemetry?.warnings ?? {};
    const trimmedSchemas = warnings["trimmed_schemas"] ?? 0;
    const trimmedSchemaColumns = warnings["trimmed_schema_columns"] ?? 0;
    const trimmedColumnTokens = warnings["trimmed_column_tokens"] ?? 0;
    const invalidSchemaTokens = warnings["invalid_schema_tokens"] ?? 0;
    const dedupSchemas = warnings["dedup_schemas"] ?? 0;
    const schemaDropped = telemetry?.schema_dropped ?? false;

    const showNotice =
        schemaDropped ||
        trimmedSchemas > 0 ||
        dedupSchemas > 0 ||
        trimmedSchemaColumns > 0 ||
        trimmedColumnTokens > 0 ||
        invalidSchemaTokens > 0;

    const metricItems =
        metrics && typeof metrics === "object"
            ? [
                  {
                      label: "Total Assets",
                      value: metrics.assets_total ?? 0,
                      accent: "border-stone/20 bg-white/95",
                  },
                  {
                      label: "High Priority",
                      value: metrics.high_priority_total ?? 0,
                      accent: "border-rose-100 bg-rose-50 text-rose-700",
                  },
                  {
                      label: "Over Limit",
                      value: metrics.over_limit_total ?? 0,
                      accent: "border-amber-100 bg-amber-50 text-amber-700",
                  },
              ]
            : [];

    return (
        <section className="surface-panel surface-panel--muted flex flex-col gap-6 p-6 text-ink shadow-deep">
            <header>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone/70">
                    Insights
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold">
                    Persona Snapshot
                </h2>
                <p className="mt-2 text-sm text-stone">
                    A concise view of the target audience for this project: who they are, what
                    they want, and which pains to address across six quick blocks.
                </p>
            </header>

            {metricItems.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                    {metricItems.map(({ label, value, accent }) => (
                        <div
                            key={label}
                            className={`rounded-2xl border px-4 py-4 text-center text-ink shadow-sm ${accent}`}
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
                                {label}
                            </p>
                            <p className="mt-2 text-3xl font-display">{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {showNotice && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900">
                    {schemaDropped ? (
                        <p>
                            Schema suggestions were omitted because the AI output did not pass
                            validation. Try regenerating the blueprint or adjusting your prompt.
                        </p>
                    ) : (
                        <p>
                            Some schema suggestions were adjusted by the sanitizer
                            {trimmedSchemas > 0 ? ` (trimmed ${trimmedSchemas})` : ""}
                            {dedupSchemas > 0 ? ` (deduplicated ${dedupSchemas})` : ""}
                            {trimmedSchemaColumns > 0
                                ? ` (columns trimmed ${trimmedSchemaColumns})`
                                : ""}
                            {trimmedColumnTokens > 0
                                ? ` (tokens trimmed ${trimmedColumnTokens})`
                                : ""}
                            {invalidSchemaTokens > 0
                                ? ` (tokens removed ${invalidSchemaTokens})`
                                : ""}
                            .
                        </p>
                    )}
                </div>
            )}

            {hasSchemas ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {schemas.map((schema) => {
                        // 1) Human-friendly titles for persona tables
                        const PERSONA_TITLES: Record<string, string> = {
                            persona_core: "Persona Overview",
                            persona_goals: "Goals & Motivations",
                            persona_pains: "Pains & Frustrations",
                            persona_objections: "Objections & Barriers",
                            persona_triggers: "Purchase Triggers",
                            persona_messaging: "Messaging & Tone",
                        };
                        const humanize = (token: string) =>
                            token
                                .replace(/_/g, " ")
                                .replace(/\s+/g, " ")
                                .trim()
                                .replace(/\b\w/g, (m) => m.toUpperCase());
                        const tableTitle =
                            PERSONA_TITLES[schema.table_name] ?? humanize(schema.table_name);

                        // 2) Parse "field_key: description" rows
                        const parseColumn = (raw: string) => {
                            const i = raw.indexOf(":");
                            if (i === -1) {
                                return { label: "", text: raw.trim() };
                            }
                            const key = raw.slice(0, i).trim();
                            const val = raw.slice(i + 1).trim();
                            const label = humanize(key);
                            return { label, text: val };
                        };

                        return (
                            <article
                                key={schema.table_name}
                                className="rounded-2xl border border-stone/20 bg-white/95 p-4 shadow-sm"
                            >
                                <header className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-ink">
                                        {tableTitle}
                                    </h3>
                                    <span className="text-xs uppercase tracking-[0.3em] text-stone/70">
                                        {schema.columns.length}{" "}
                                        {schema.columns.length === 1 ? "column" : "columns"}
                                    </span>
                                </header>
                                <ul className="mt-4 space-y-2 text-sm text-stone">
                                    {schema.columns.map((column, index) => {
                                        const { label, text } = parseColumn(column ?? "");
                                        return (
                                            <li
                                                key={`${schema.table_name}-${index}`}
                                                className="rounded-2xl border border-stone/15 bg-frost/80 px-3 py-2"
                                            >
                                                {label ? (
                                                    <>
                                                        <span className="font-semibold text-ink/90">
                                                            {label}
                                                        </span>
                                                        {text ? <span>: {text}</span> : null}
                                                    </>
                                                ) : (
                                                    <>{text}</>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-stone">
                    Schema suggestions are not available yet. Generate or refresh the
                    blueprint to populate this section.
                </p>
            )}
        </section>
    );
};

export default SchemaPanel;
