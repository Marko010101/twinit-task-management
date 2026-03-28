import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetTasksResponse, TaskFilter } from "@my-app/shared";
import { fetchTasks, taskQueryKeys } from "@/features/tasks/api/task.api";

export function useTasks(
  filter: TaskFilter = "all",
  page: number = 1,
): UseQueryResult<GetTasksResponse, Error> {
  return useQuery({
    queryKey: taskQueryKeys.list(filter, page),
    queryFn: () => fetchTasks(filter, page),
    placeholderData: (prev) => prev,
  });
}
