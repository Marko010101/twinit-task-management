import { TaskDto, TaskId, TaskFilter } from "@my-app/shared";
import { randomUUID } from "crypto";

export interface ITaskRepository {
  findAll(filter?: TaskFilter): Promise<TaskDto[]>;
  findById(id: TaskId): Promise<TaskDto | undefined>;
  create(data: { title: string }): Promise<TaskDto>;
  save(task: TaskDto): Promise<TaskDto>;
}

export class TaskRepository implements ITaskRepository {
  private tasks: Map<TaskId, TaskDto>;

  constructor(seed: readonly TaskDto[] = []) {
    this.tasks = new Map(seed.map((t) => [t.id, { ...t }]));
  }

  async findAll(filter?: TaskFilter): Promise<TaskDto[]> {
    const all = Array.from(this.tasks.values());
    const filtered =
      filter === "completed"
        ? all.filter((t) => t.completed)
        : filter === "active"
          ? all.filter((t) => !t.completed)
          : all;
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((t) => ({ ...t }));
  }

  async findById(id: TaskId): Promise<TaskDto | undefined> {
    const task = this.tasks.get(id);
    return task ? { ...task } : undefined;
  }

  async create(data: { title: string }): Promise<TaskDto> {
    const task: TaskDto = {
      id: randomUUID(),
      title: data.title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, { ...task });
    return { ...task };
  }

  async save(task: TaskDto): Promise<TaskDto> {
    this.tasks.set(task.id, { ...task });
    return { ...task };
  }

  // For test isolation only — not on ITaskRepository
  clear(): void {
    this.tasks = new Map();
  }
}

export const taskRepository = new TaskRepository();
