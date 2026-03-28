import type { TaskDto } from "@my-app/shared";
import { useCompleteTask } from "@/features/tasks/hooks/useCompleteTask";
import { CheckCircle2, Circle } from "lucide-react";

interface TaskItemProps {
  task: TaskDto;
}

export function TaskItem({ task }: TaskItemProps) {
  const { mutate: completeTask } = useCompleteTask();

  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <button
        onClick={() => completeTask(task.id)}
        disabled={task.completed}
        aria-label={task.completed ? "Task completed" : "Mark as complete"}
        className={`shrink-0 text-gray-300 hover:text-green-500  transition-colors ${!task.completed ? "cursor-pointer" : ""}`}
      >
        {task.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}
        >
          {task.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(task.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </li>
  );
}
