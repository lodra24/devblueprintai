import React from "react";

const CardSkeleton = () => (
    <div className="p-4 bg-gray-800 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-5/6"></div>
    </div>
);

export const BoardSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {Array.from({ length: 3 }).map((_, colIndex) => (
                <div key={colIndex} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="h-6 bg-gray-700 rounded w-1/2 mb-6 animate-pulse"></div>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, cardIndex) => (
                            <CardSkeleton key={cardIndex} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
