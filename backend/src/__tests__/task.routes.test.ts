import request from "supertest";
import app from "../app";
import { taskRepository } from "../repositories/task.repository";

beforeEach(() => {
  taskRepository.clear();
});

describe("POST /tasks", () => {
  it("returns 201 and the created task on a valid title", async () => {
    const res = await request(app).post("/tasks").send({ title: "Go to Gym" });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe("Go to Gym");
    expect(res.body.completed).toBe(false);
    expect(res.body.createdAt).toBeDefined();
  });

  it("returns 400 when title is an empty string", async () => {
    const res = await request(app).post("/tasks").send({ title: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when title is whitespace only", async () => {
    const res = await request(app).post("/tasks").send({ title: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when title is missing", async () => {
    const res = await request(app).post("/tasks").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe("GET /tasks", () => {
  it("returns 400 when filter is an unrecognized value", async () => {
    const res = await request(app).get("/tasks?filter=activeeeee");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 200 and an empty list when no tasks exist", async () => {
    const res = await request(app).get("/tasks");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it("returns 200 and all created tasks", async () => {
    await request(app).post("/tasks").send({ title: "Task 1" });
    await request(app).post("/tasks").send({ title: "Task 2" });

    const res = await request(app).get("/tasks");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it("returns 200 and only active tasks when filter=active", async () => {
    const createRes = await request(app).post("/tasks").send({ title: "Task 1" });
    await request(app).post("/tasks").send({ title: "Task 2" });
    await request(app).patch(`/tasks/${createRes.body.id}/complete`);

    const res = await request(app).get("/tasks?filter=active");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe("Task 2");
  });

  it("returns 200 and only completed tasks when filter=completed", async () => {
    const createRes = await request(app).post("/tasks").send({ title: "Task 1" });
    await request(app).post("/tasks").send({ title: "Task 2" });
    await request(app).patch(`/tasks/${createRes.body.id}/complete`);

    const res = await request(app).get("/tasks?filter=completed");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe("Task 1");
  });
});

describe("PATCH /tasks/:id/complete", () => {
  it("returns 200 and completed: true when marking a task complete", async () => {
    const createRes = await request(app).post("/tasks").send({ title: "Task" });

    const res = await request(app).patch(`/tasks/${createRes.body.id}/complete`);

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("is idempotent — completing an already-completed task returns 200", async () => {
    const createRes = await request(app).post("/tasks").send({ title: "Task" });
    await request(app).patch(`/tasks/${createRes.body.id}/complete`);

    const res = await request(app).patch(`/tasks/${createRes.body.id}/complete`);

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("returns 404 with an error message for an unknown id", async () => {
    const res = await request(app).patch("/tasks/nonexistent-id/complete");

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /tasks — pagination", () => {
  beforeEach(async () => {
    for (let i = 1; i <= 12; i++) {
      await request(app).post("/tasks").send({ title: `Task ${i}` });
    }
  });

  it("returns pagination metadata alongside items on the default response", async () => {
    const res = await request(app).get("/tasks");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total: 12,
      page: 1,
      limit: 10,
      totalPages: 2,
    });
    expect(res.body.items).toHaveLength(10);
  });

  it("returns the second page with remaining items", async () => {
    const res = await request(app).get("/tasks?page=2&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.page).toBe(2);
    expect(res.body.total).toBe(12);
    expect(res.body.totalPages).toBe(2);
  });

  it("respects a custom limit and recalculates totalPages", async () => {
    const res = await request(app).get("/tasks?page=1&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(5);
    expect(res.body.limit).toBe(5);
    expect(res.body.totalPages).toBe(3);
  });

  it("returns empty items when page is beyond totalPages", async () => {
    const res = await request(app).get("/tasks?page=100");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe(12);
  });

  it("falls back to defaults for non-numeric page and limit", async () => {
    const res = await request(app).get("/tasks?page=abc&limit=xyz");

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
  });

  it("applies pagination on top of an active filter", async () => {
    const res = await request(app).get("/tasks?filter=active&page=2&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(5);
    expect(res.body.total).toBe(12);
    expect(res.body.page).toBe(2);
  });
});
