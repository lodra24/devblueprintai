export interface DerivedFields {
    meta: {
        var_id?: string | null;
        angle_name?: string | null;
        [key: string]: any;
    };
    assets: {
        hook?: string | null;
        google_h1?: string | null;
        google_desc?: string | null;
        meta_primary?: string | null;
        lp_h1?: string | null;
        email_subject?: string | null;
        cta?: string | null;
    };
    reasoning: {
        proof?: string | null;
        objection?: string | null;
        [key: string]: any;
    };
    limits: Record<string, number>;
    char_counts: Record<string, number>;
    over_limit_fields: string[];
    over_limit_count: number;
}
