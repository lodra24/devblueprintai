import React, { FormEvent, useMemo } from "react";
import { CloseIcon, SearchIcon } from "@/components/icons";
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

    const hasActiveFilters =
        filters.priority !== "all" ||
        filters.overLimit !== "all" ||
        filters.angles.length > 0 ||
        searchTerm.trim() !== "";

    return (
        <section className="surface-panel surface-panel--muted mt-8 px-5 py-6 shadow-deep">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                    <label className="flex w-full items-center gap-3 rounded-2xl border border-stone/20 bg-white px-4 py-2.5 text-sm text-stone shadow-sm focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10">
                        <SearchIcon className="text-stone" />
                        <input
                            type="search"
                            value={searchTerm}
                            onInput={handleSearchChange}
                            className="flex-1 bg-transparent text-base text-ink placeholder:text-stone focus:outline-none"
                            placeholder="Search hooks, assets, angles..."
                        />
                    </label>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
                    <Select
                        label="Priority"
                        options={priorityOptions}
                        value={filters.priority}
                        onChange={(value) =>
                            onFiltersChange({ ...filters, priority: value })
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

            <div className="mt-6 space-y-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone/70">
                        Angles
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {availableAngles.length > 0 ? (
                            availableAngles.map((angle) => {
                                const isActive = filters.angles.includes(angle);
                                return (
                                    <button
                                        key={angle}
                                        type="button"
                                        onClick={() => toggleAngle(angle)}
                                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                            isActive
                                                ? "border border-accent/40 bg-accent text-white shadow-deep"
                                                : "border border-stone/20 bg-pastel-lilac text-ink/80 hover:border-accent/30"
                                        }`}
                                    >
                                        {angle}
                                    </button>
                                );
                            })
                        ) : (
                            <span className="text-xs text-stone">
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
                            className="flex items-center gap-2 rounded-full border border-stone/20 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-accent/30"
                        >
                            {chip.label}
                            <CloseIcon className="text-stone" />
                        </button>
                    ))}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="rounded-full border border-stone/30 px-3 py-1 text-xs font-semibold text-stone transition hover:border-ink/30"
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
    <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.2em] text-stone/70">
        {label}
        <select
            value={value}
            onChange={(event) => onChange(event.currentTarget.value as T)}
            className="mt-1 rounded-xl border border-stone/20 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
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
