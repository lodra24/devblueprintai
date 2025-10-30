export interface BlueprintTelemetry {
    parse_mode: string | null;
    schema_dropped: boolean | null;
    warnings: Record<string, number>;
}
