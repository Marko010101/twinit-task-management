import { useSearchParams } from "react-router-dom";
import type { TaskFilter } from "@my-app/shared";
import { TaskForm } from "@/features/tasks/components/TaskForm";
import { TaskFilters } from "@/features/tasks/components/TaskFilters";
import { TaskList } from "@/features/tasks/components/TaskList";

function isTaskFilter(value: string): value is TaskFilter {
  return value === "all" || value === "active" || value === "completed";
}

export default function TaskPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawFilter = searchParams.get("filter") ?? "all";
  const filter: TaskFilter = isTaskFilter(rawFilter) ? rawFilter : "all";

  const rawPage = searchParams.get("page") ?? "1";
  const page = Math.max(1, parseInt(rawPage, 10) || 1);

  function handleFilterChange(next: TaskFilter) {
    // Switching filters resets to page 1 — omit both params when defaults
    setSearchParams(next === "all" ? {} : { filter: next }, { replace: true });
  }

  function handlePageChange(next: number) {
    const params: Record<string, string> = {};
    if (filter !== "all") params.filter = filter;
    if (next > 1) params.page = String(next);
    setSearchParams(params);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">Stay on top of what matters.</p>
        </header>

        <div className="space-y-4">
          <TaskForm />

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <TaskFilters filter={filter} onChange={handleFilterChange} />
            </div>
            <TaskList filter={filter} page={page} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
