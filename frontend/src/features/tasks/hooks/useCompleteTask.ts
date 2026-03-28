import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, QueryKey } from "@tanstack/react-query";
import type { TaskDto, TaskId, GetTasksResponse } from "@my-app/shared";
import { completeTask, taskQueryKeys } from "@/features/tasks/api/task.api";

type CompleteTaskContext = {
  previousData: [QueryKey, GetTasksResponse | undefined][];
};

export function useCompleteTask(): UseMutationResult<TaskDto, Error, TaskId, CompleteTaskContext> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.lists() });

      const previousData = queryClient.getQueriesData<GetTasksResponse>({
        queryKey: taskQueryKeys.lists(),
      });

      queryClient.setQueriesData<GetTasksResponse>(
        { queryKey: taskQueryKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((task) =>
              task.id === taskId ? { ...task, completed: true } : task
            ),
          };
        },
      );

      return { previousData };
    },
    onError: (error, _taskId, context) => {
      if (context) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      console.error("Failed to complete task:", error.message);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}
