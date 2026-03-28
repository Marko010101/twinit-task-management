import type { TaskDto, TaskFilter, TaskId, CreateTaskRequest, GetTasksResponse } from "@my-app/shared";
import { apiClient } from "@/lib/axios";

export const taskQueryKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskQueryKeys.all, "list"] as const,
  list: (filter: TaskFilter, page: number) => [...taskQueryKeys.lists(), filter, page] as const,
} as const;

export async function fetchTasks(filter: TaskFilter, page: number): Promise<GetTasksResponse> {
  const params: Record<string, string | number> = { page };
  if (filter !== "all") params.filter = filter;
  const response = await apiClient.get<GetTasksResponse>("/tasks", { params });
  return response.data;
}

export async function createTask(body: CreateTaskRequest): Promise<TaskDto> {
  const response = await apiClient.post<TaskDto>("/tasks", body);
  return response.data;
}

export async function completeTask(id: TaskId): Promise<TaskDto> {
  const response = await apiClient.patch<TaskDto>(`/tasks/${id}/complete`);
  return response.data;
}
