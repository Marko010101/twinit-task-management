import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, QueryKey } from "@tanstack/react-query";
import type { TaskDto, CreateTaskRequest, GetTasksResponse } from "@my-app/shared";
import { createTask, taskQueryKeys } from "@/features/tasks/api/task.api";

type MutationContext = { previousData: [QueryKey, GetTasksResponse | undefined][] };

export function useCreateTask(): UseMutationResult<TaskDto, Error, CreateTaskRequest, MutationContext> {
  const queryClient = useQueryClient();

  return useMutation<TaskDto, Error, CreateTaskRequest, MutationContext>({
    mutationFn: createTask,

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.lists() });

      const previousData = queryClient.getQueriesData<GetTasksResponse>({
        queryKey: taskQueryKeys.lists(),
      });

      const optimisticTask: TaskDto = {
        id: `optimistic-${Date.now()}`,
        title: variables.title,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueriesData<GetTasksResponse>(
        {
          predicate: (query) => {
            const [, , filter, page] = query.queryKey as [unknown, unknown, string, number];
            return (filter === "all" || filter === "active") && page === 1;
          },
        },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [optimisticTask, ...old.items],
            total: old.total + 1,
            totalPages: Math.ceil((old.total + 1) / old.limit),
          };
        },
      );

      return { previousData };
    },

    onError: (_err, _vars, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}
