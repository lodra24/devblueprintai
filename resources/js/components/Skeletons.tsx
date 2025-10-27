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

export const ProjectListSkeleton = () => (
    <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
            <div
                key={index}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg bg-gray-800/60 p-4 shadow animate-pulse"
            >
                <div className="w-full sm:w-auto flex-1 space-y-3">
                    <div className="h-5 w-32 bg-gray-700 rounded" />
                    <div className="h-4 w-40 bg-gray-700 rounded" />
                </div>
                <div className="h-9 w-32 bg-gray-700/80 rounded" />
            </div>
        ))}
    </div>
);
