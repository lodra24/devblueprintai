const CardSkeleton = () => (
    <div className="rounded-2xl border border-stone/15 bg-white/90 p-4 shadow-sm animate-pulse">
        <div className="h-4 rounded-full bg-stone/20 w-3/4 mb-4" />
        <div className="h-3 rounded-full bg-stone/15 w-full mb-2" />
        <div className="h-3 rounded-full bg-stone/15 w-5/6" />
    </div>
);

export const BoardSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, colIndex) => (
            <div
                key={colIndex}
                className="rounded-3xl border border-stone/15 bg-frost/70 p-5 shadow-deep animate-pulse"
            >
                <div className="h-6 w-1/2 rounded-full bg-stone/20 mb-6" />
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, cardIndex) => (
                        <CardSkeleton key={cardIndex} />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export const ProjectListSkeleton = () => (
    <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="row-card px-5 py-4 md:px-6 md:py-5 animate-pulse">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 space-y-3">
                        <div className="h-5 w-48 rounded-full bg-stone/20" />
                        <div className="h-4 w-40 rounded-full bg-stone/15" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-28 rounded-full bg-stone/15" />
                        <div className="h-10 w-10 rounded-2xl border border-stone/15 bg-white/80" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);
