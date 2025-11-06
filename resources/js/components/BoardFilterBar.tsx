import React, { FormEvent, useMemo } from "react";
import { BoardDensity, BoardFilters, BoardSortOption } from "@/types";

interface BoardFilterBarProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    filters: BoardFilters;
    onFiltersChange: (filters: BoardFilters) => void;
    sortBy: BoardSortOption;
    onSortByChange: (value: BoardSortOption) => void;
    density: BoardDensity;
    onDensityChange: (value: BoardDensity) => void;
    availableAngles: string[];
    onClearFilters: () => void;
}

const priorityOptions: Array<{ label: string; value: BoardFilters["priority"] }> = [
    { label: "All", value: "all" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
];

const statusOptions: Array<{ label: string; value: BoardFilters["status"] }> = [
    { label: "All", value: "all" },
    { label: "Todo", value: "todo" },
    { label: "In Progress", value: "in_progress" },
    { label: "Done", value: "done" },
];

const overLimitOptions: Array<{ label: string; value: BoardFilters["overLimit"] }> = [
    { label: "All", value: "all" },
    { label: "Yes", value: "over" },
    { label: "No", value: "within" },
];

const sortOptions: Array<{ label: string; value: BoardSortOption }> = [
    { label: "Priority", value: "priority" },
    { label: "Var ID", value: "var_id" },
    { label: "Over Limit Count", value: "over_limit" },
    { label: "Updated Date", value: "updated_at" },
    { label: "Board Order", value: "board" },
];

const densityOptions: Array<{ label: string; value: BoardDensity }> = [
    { label: "Cozy", value: "cozy" },
    { label: "Comfort", value: "comfortable" },
    { label: "Dense", value: "compact" },
];

const BoardFilterBar: React.FC<BoardFilterBarProps> = ({
    searchTerm,
    onSearchTermChange,
    filters,
    onFiltersChange,
    sortBy,
    onSortByChange,
    density,
    onDensityChange,
    availableAngles,
    onClearFilters,
}) => {
    const appliedFilterChips = useMemo(() => {
        const chips: Array<{ label: string; onRemove: () => void }> = [];

        if (filters.priority !== "all") {
            chips.push({
                label: `Priority: ${labelize(filters.priority)}`,
                onRemove: () =>
                    onFiltersChange({ ...filters, priority: "all" }),
            });
        }

        if (filters.status !== "all") {
            chips.push({
                label: `Status: ${labelize(filters.status)}`,
                onRemove: () =>
                    onFiltersChange({ ...filters, status: "all" }),
            });
        }

        if (filters.overLimit !== "all") {
            chips.push({
                label: `Over Limit: ${filters.overLimit === "over" ? "Yes" : "No"}`,
                onRemove: () =>
                    onFiltersChange({ ...filters, overLimit: "all" }),
            });
        }

        filters.angles.forEach((angle) => {
            chips.push({
                label: `Angle: ${angle}`,
                onRemove: () =>
                    onFiltersChange({
                        ...filters,
                        angles: filters.angles.filter((item) => item !== angle),
                    }),
            });
        });

        return chips;
    }, [filters, onFiltersChange]);

    const handleSearchChange = (event: FormEvent<HTMLInputElement>) => {
        onSearchTermChange(event.currentTarget.value);
    };

    const toggleAngle = (angle: string) => {
        if (filters.angles.includes(angle)) {
            onFiltersChange({
                ...filters,
                angles: filters.angles.filter((item) => item !== angle),
            });
        } else {
            onFiltersChange({
                ...filters,
                angles: [...filters.angles, angle],
            });
        }
    };

    return (
        <section className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg shadow-slate-900/30">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                    <label className="flex w-full items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus-within:border-slate-500">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-slate-400"
                        >
                            <path
                                d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M21 21L16.65 16.65"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Search hook, copy, var ID..."
                            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                        />
                    </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        label="Priority"
                        options={priorityOptions}
                        value={filters.priority}
                        onChange={(value) =>
                            onFiltersChange({ ...filters, priority: value })
                        }
                    />
                    <Select
                        label="Status"
                        options={statusOptions}
                        value={filters.status}
                        onChange={(value) =>
                            onFiltersChange({ ...filters, status: value })
                        }
                    />
                    <Select
                        label="Over limit"
                        options={overLimitOptions}
                        value={filters.overLimit}
                        onChange={(value) =>
                            onFiltersChange({ ...filters, overLimit: value })
                        }
                    />
                    <Select
                        label="Sort by"
                        options={sortOptions}
                        value={sortBy}
                        onChange={onSortByChange}
                    />
                    <Select
                        label="Density"
                        options={densityOptions}
                        value={density}
                        onChange={onDensityChange}
                    />
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Angles
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {availableAngles.length ? (
                            availableAngles.map((angle) => {
                                const isActive = filters.angles.includes(angle);
                                return (
                                    <button
                                        key={angle}
                                        type="button"
                                        onClick={() => toggleAngle(angle)}
                                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                            isActive
                                                ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/40"
                                                : "bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700"
                                        }`}
                                    >
                                        {angle}
                                    </button>
                                );
                            })
                        ) : (
                            <span className="text-xs text-slate-500">
                                No angles detected yet.
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {appliedFilterChips.map((chip) => (
                        <button
                            key={chip.label}
                            type="button"
                            onClick={chip.onRemove}
                            className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                        >
                            {chip.label}
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-slate-400"
                            >
                                <path
                                    d="M7 7L17 17M7 17L17 7"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    ))}
                    {(filters.priority !== "all" ||
                        filters.status !== "all" ||
                        filters.overLimit !== "all" ||
                        filters.angles.length > 0 ||
                        searchTerm.trim() !== "") && (
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="rounded-full border border-slate-600/60 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-slate-400"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};

interface SelectOption<T extends string> {
    label: string;
    value: T;
}

interface SelectProps<T extends string> {
    label: string;
    options: Array<SelectOption<T>>;
    value: T;
    onChange: (value: T) => void;
}

const Select = <T extends string>({
    label,
    options,
    value,
    onChange,
}: SelectProps<T>) => (
    <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        <select
            value={value}
            onChange={(event) => onChange(event.currentTarget.value as T)}
            className="mt-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </label>
);

const labelize = (value: string) =>
    value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

export default BoardFilterBar;
