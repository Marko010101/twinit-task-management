export type TaskId = string;

export type TaskFilter = "all" | "active" | "completed";

export interface TaskDto {
  readonly id: TaskId;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: string;
}

export interface CreateTaskRequest {
  title: string;
}

export interface GetTasksQuery {
  filter?: TaskFilter;
  page?: string;
  limit?: string;
}

export interface GetTasksResponse {
  items: TaskDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
