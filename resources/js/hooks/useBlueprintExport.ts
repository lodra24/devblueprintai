import { useCallback, useState } from "react";
import { Project } from "@/types";
import { downloadCsvFile, generateProjectCsv } from "@/lib/csvExporter";
import { useToast } from "@/contexts/ToastContext";

export const useBlueprintExport = (project?: Project | null) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { showToast } = useToast();

    const handleDownloadAllCsv = useCallback(async () => {
        if (!project) {
            return;
        }

        try {
            setIsDownloading(true);
            const csvContent = await generateProjectCsv(project, ",");

            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);

            let safeName = project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            if (!safeName) {
                safeName = project.id || "blueprint_export";
            }
            const filename = `${safeName.slice(0, 50)}_${timestamp}.csv`;

            downloadCsvFile(csvContent, filename);
            showToast({ type: "success", message: "CSV exported." });
        } catch (error) {
            console.error("CSV export failed:", error);
            showToast({ type: "error", message: "Failed to export CSV." });
        } finally {
            setIsDownloading(false);
        }
    }, [project, showToast]);

    return {
        isDownloading,
        handleDownloadAllCsv,
    };
};
