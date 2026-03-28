import { useState } from "react";
import { useCreateTask } from "@/features/tasks/hooks/useCreateTask";
import { Plus } from "lucide-react";

export function TaskForm() {
  const [title, setTitle] = useState("");
  const { mutate, isPending, error, reset } = useCreateTask();

  function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle("");
    mutate({ title: trimmed });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) reset();
          }}
          placeholder="Add a new task..."
          disabled={isPending}
          maxLength={200}
          className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition"
        />
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </form>
  );
}
