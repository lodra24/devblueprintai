import { Project, UserStory, Epic } from "@/types";

/**
 * Escapes a single CSV cell by wrapping it in quotes and escaping inner quotes.
 */
const escapeCsvCell = (data: unknown): string => {
    if (data === null || data === undefined) {
        return "";
    }
    return `"${String(data).replace(/"/g, '""')}"`;
};

/**
 * Generates CSV content from a Project without blocking the UI thread.
 */
export const generateProjectCsv = async (
    project: Project,
    delimiter: string = ","
): Promise<string> => {
    const headers = [
        "Epic / Angle",
        "User Story ID",
        "Content",
        "Priority",
        "Var ID",
        "Google H1",
        "Google Description",
        "Meta Primary",
        "LP H1",
        "Email Subject",
        "CTA",
        "Proof",
        "Objection",
        "Is AI Generated",
    ];

    const rows: string[] = [headers.join(delimiter)];
    const epics: Epic[] = project.epics || [];
    let processed = 0;

    for (const epic of epics) {
        const stories: UserStory[] = epic.user_stories || [];

        for (const story of stories) {
            // Yield to the event loop periodically to keep UI responsive on large exports.
            if (processed++ % 50 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 0));
            }

            const derived = story.derived_fields;
            const meta = derived?.meta;
            const assets = derived?.assets;
            const reasoning = derived?.reasoning;

            const row = [
                epic.title,
                story.id,
                story.content,
                story.priority,
                meta?.var_id,
                assets?.google_h1,
                assets?.google_desc,
                assets?.meta_primary,
                assets?.lp_h1,
                assets?.email_subject,
                assets?.cta,
                reasoning?.proof,
                reasoning?.objection,
                story.is_ai_generated ? "Yes" : "No",
            ]
                .map(escapeCsvCell)
                .join(delimiter);

            rows.push(row);
        }
    }

    return rows.join("\r\n");
};

/**
 * Triggers a CSV file download in the browser with BOM for Excel compatibility.
 */
export const downloadCsvFile = (content: string, filename: string) => {
    if (typeof window === "undefined") {
        return;
    }

    const blob = new Blob(["\ufeff" + content], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
