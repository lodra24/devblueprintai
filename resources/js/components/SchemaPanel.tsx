import React from "react";
import { BlueprintTelemetry, SchemaSuggestion } from "@/types";

type SchemaPanelProps = {
    schemas: SchemaSuggestion[];
    telemetry?: BlueprintTelemetry | null;
};

const SchemaPanel: React.FC<SchemaPanelProps> = ({ schemas, telemetry }) => {
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

    return (
        <section className="mt-12">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-sky-400">
                    Measurement & KPI Plan
                </h2>
            </div>

            {showNotice ? (
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                    {schemaDropped ? (
                        <p>
                            Schema suggestions were omitted because the AI output did not
                            pass validation. Try regenerating the blueprint or adjusting
                            your prompt.
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
            ) : null}

            {hasSchemas ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {schemas.map((schema) => (
                        <article
                            key={schema.table_name}
                            className="rounded-lg border border-sky-700/20 bg-slate-800/40 p-4 shadow-lg shadow-sky-900/20"
                        >
                            <header className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">
                                    {schema.table_name}
                                </h3>
                                <span className="text-xs uppercase tracking-widest text-white/40">
                                    {schema.columns.length}{" "}
                                    {schema.columns.length === 1 ? "column" : "columns"}
                                </span>
                            </header>
                            <ul className="mt-4 space-y-2 text-sm text-white/80">
                                {schema.columns.map((column, index) => (
                                    <li
                                        key={`${schema.table_name}-${index}-${column}`}
                                        className="rounded bg-slate-900/50 px-3 py-2"
                                    >
                                        {column}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="mt-4 text-sm text-white/60">
                    Schema suggestions are not available yet. Generate or refresh the
                    blueprint to populate this section.
                </p>
            )}
        </section>
    );
};

export default SchemaPanel;
