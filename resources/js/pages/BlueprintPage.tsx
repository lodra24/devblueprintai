import React from "react";
import { useParams } from "react-router-dom";

function BlueprintPage() {
    const { projectId } = useParams<{ projectId: string }>();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
            <h1 className="text-3xl font-bold text-sky-400">
                Project Blueprint
            </h1>
            <p className="mt-4 text-lg text-gray-300">
                Loading project data for ID: {projectId}
            </p>
            {/* The actual project board will be rendered here later */}
        </div>
    );
}

export default BlueprintPage;
