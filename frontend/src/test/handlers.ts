import { http, HttpResponse } from "msw";
import type { TaskDto, GetTasksResponse } from "@my-app/shared";

export const SEED_TASKS: TaskDto[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  title: `Task ${i + 1}`,
  completed: i % 3 === 0, // tasks 1, 4, 7, 10 are completed
  createdAt: new Date(2026, 0, i + 1).toISOString(),
}));

export const handlers = [
  http.get("http://localhost:3000/tasks", ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get("filter");
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = 10;

    let items = SEED_TASKS;
    if (filter === "active") items = SEED_TASKS.filter((t) => !t.completed);
    if (filter === "completed") items = SEED_TASKS.filter((t) => t.completed);

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;

    const response: GetTasksResponse = {
      items: items.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages,
    };
    return HttpResponse.json(response);
  }),

  http.post("http://localhost:3000/tasks", async ({ request }) => {
    const body = (await request.json()) as { title?: string };
    if (!body.title?.trim()) {
      return HttpResponse.json({ message: "Title is required" }, { status: 400 });
    }
    const task: TaskDto = {
      id: crypto.randomUUID(),
      title: body.title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(task, { status: 201 });
  }),

  http.patch("http://localhost:3000/tasks/:id/complete", ({ params }) => {
    const task = SEED_TASKS.find((t) => t.id === params["id"]);
    if (!task) {
      return HttpResponse.json({ message: "Task not found" }, { status: 404 });
    }
    return HttpResponse.json({ ...task, completed: true });
  }),
];
