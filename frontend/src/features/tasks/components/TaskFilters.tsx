import type { TaskFilter } from "@my-app/shared";

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

interface TaskFiltersProps {
  filter: TaskFilter;
  onChange: (filter: TaskFilter) => void;
}

export function TaskFilters({ filter, onChange }: TaskFiltersProps) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
            filter === value ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
