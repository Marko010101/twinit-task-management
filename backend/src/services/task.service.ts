import { TaskDto, TaskId, CreateTaskRequest, TaskFilter, GetTasksResponse } from "@my-app/shared";
import { ITaskRepository, taskRepository } from "../repositories/task.repository";
import { NotFoundError, ValidationError } from "../errors";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export class TaskService {
  constructor(private readonly repository: ITaskRepository) {}

  async getTasks(filter: TaskFilter = "all", page = DEFAULT_PAGE, limit = DEFAULT_LIMIT): Promise<GetTasksResponse> {
    const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : DEFAULT_PAGE;
    const safeLimit = Number.isFinite(limit) && limit >= 1 ? Math.min(Math.floor(limit), MAX_LIMIT) : DEFAULT_LIMIT;

    const all = await this.repository.findAll(filter === "all" ? undefined : filter);
    const total = all.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);
    const start = (safePage - 1) * safeLimit;
    const items = all.slice(start, start + safeLimit);

    return { items, total, page: safePage, limit: safeLimit, totalPages };
  }

  async createTask(data: CreateTaskRequest): Promise<TaskDto> {
    if (!data.title?.trim()) throw new ValidationError("Title is required");
    return this.repository.create({ title: data.title.trim() });
  }

  async completeTask(id: TaskId): Promise<TaskDto> {
    const task = await this.repository.findById(id);
    if (!task) throw new NotFoundError(`Task with id "${id}" not found`);
    if (task.completed) return task;
    return this.repository.save({ ...task, completed: true });
  }
}

export const taskService = new TaskService(taskRepository);
