import type { TaskFilter } from "@my-app/shared";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { TaskItem } from "./TaskItem";
import { TaskListSkeleton } from "./TaskListSkeleton";
import { Pagination } from "./Pagination";
import { AlertCircle, ClipboardList } from "lucide-react";

const EMPTY_MESSAGES: Record<TaskFilter, string> = {
  all: "No tasks yet. Add one above.",
  active: "No active tasks.",
  completed: "No completed tasks.",
};

interface TaskListProps {
  filter: TaskFilter;
  page: number;
  onPageChange: (page: number) => void;
}

export function TaskList({ filter, page, onPageChange }: TaskListProps) {
  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useTasks(filter, page);

  if (isLoading) {
    return <TaskListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-gray-600">{error.message}</p>
        <button onClick={() => void refetch()} className="text-sm text-indigo-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const tasks = data?.items ?? [];

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <ClipboardList className="w-8 h-8 text-gray-300" />
        <p className="text-sm text-gray-500">{EMPTY_MESSAGES[filter]}</p>
      </div>
    );
  }

  return (
    <>
      <ul aria-busy={isPlaceholderData} className={`divide-y divide-gray-100 transition-opacity duration-200 ${isPlaceholderData ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={onPageChange} />
      )}
    </>
  );
}
