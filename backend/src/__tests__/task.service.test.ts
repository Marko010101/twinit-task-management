import { TaskService } from "../services/task.service";
import { TaskRepository } from "../repositories/task.repository";
import { NotFoundError, ValidationError } from "../errors";

let repository: TaskRepository;
let service: TaskService;

beforeEach(() => {
  repository = new TaskRepository([]);
  service = new TaskService(repository);
});

describe("TaskService", () => {
  describe("createTask", () => {
    it("creates a task with a valid title", async () => {
      const task = await service.createTask({ title: "Buy milk" });

      expect(task.id).toBeDefined();
      expect(task.title).toBe("Buy milk");
      expect(task.completed).toBe(false);
      expect(task.createdAt).toBeDefined();
    });

    it("trims whitespace from the title", async () => {
      const task = await service.createTask({ title: "  Buy milk  " });

      expect(task.title).toBe("Buy milk");
    });

    it("throws ValidationError when title is an empty string", async () => {
      await expect(service.createTask({ title: "" })).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when title is whitespace only", async () => {
      await expect(service.createTask({ title: "   " })).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when title is missing", async () => {
      await expect(service.createTask({} as { title: string })).rejects.toThrow(ValidationError);
    });
  });

  describe("getTasks", () => {
    it("returns an empty list when no tasks exist", async () => {
      const result = await service.getTasks();

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("returns all tasks by default", async () => {
      await service.createTask({ title: "Task 1" });
      await service.createTask({ title: "Task 2" });

      const result = await service.getTasks();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("filters to active (incomplete) tasks only", async () => {
      const task1 = await service.createTask({ title: "Task 1" });
      await service.createTask({ title: "Task 2" });
      await service.completeTask(task1.id);

      const result = await service.getTasks("active");

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Task 2");
    });

    it("filters to completed tasks only", async () => {
      const task1 = await service.createTask({ title: "Task 1" });
      await service.createTask({ title: "Task 2" });
      await service.completeTask(task1.id);

      const result = await service.getTasks("completed");

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Task 1");
    });

    describe("pagination", () => {
      beforeEach(async () => {
        for (let i = 1; i <= 15; i++) {
          await service.createTask({ title: `Task ${i}` });
        }
      });

      it("defaults to page 1 with limit 10 and returns correct metadata", async () => {
        const result = await service.getTasks();

        expect(result.items).toHaveLength(10);
        expect(result.total).toBe(15);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(2);
      });

      it("returns the remaining items on page 2", async () => {
        const result = await service.getTasks("all", 2, 10);

        expect(result.items).toHaveLength(5);
        expect(result.page).toBe(2);
        expect(result.total).toBe(15);
        expect(result.totalPages).toBe(2);
      });

      it("respects a custom limit and recalculates totalPages", async () => {
        const result = await service.getTasks("all", 1, 5);

        expect(result.items).toHaveLength(5);
        expect(result.limit).toBe(5);
        expect(result.totalPages).toBe(3);
      });

      it("returns empty items when page is beyond totalPages", async () => {
        const result = await service.getTasks("all", 99, 10);

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(15);
      });

      it("defaults page to 1 when given zero", async () => {
        const result = await service.getTasks("all", 0);

        expect(result.page).toBe(1);
      });

      it("defaults page to 1 when given NaN", async () => {
        const result = await service.getTasks("all", NaN);

        expect(result.page).toBe(1);
      });

      it("defaults limit to 10 when given zero", async () => {
        const result = await service.getTasks("all", 1, 0);

        expect(result.limit).toBe(10);
      });

      it("defaults limit to 10 when given NaN", async () => {
        const result = await service.getTasks("all", 1, NaN);

        expect(result.limit).toBe(10);
      });

      it("caps limit at 100", async () => {
        const result = await service.getTasks("all", 1, 200);

        expect(result.limit).toBe(100);
      });

      it("returns totalPages of 0 when the store is empty", async () => {
        repository = new TaskRepository([]);
        service = new TaskService(repository);

        const result = await service.getTasks();

        expect(result.totalPages).toBe(0);
        expect(result.total).toBe(0);
      });
    });
  });

  describe("completeTask", () => {
    it("marks a task as completed", async () => {
      const task = await service.createTask({ title: "Some task" });

      const completed = await service.completeTask(task.id);

      expect(completed.completed).toBe(true);
    });

    it("is idempotent — completing an already-completed task returns it unchanged", async () => {
      const task = await service.createTask({ title: "Some task" });
      await service.completeTask(task.id);

      const result = await service.completeTask(task.id);

      expect(result.completed).toBe(true);
    });

    it("throws NotFoundError for an unknown id", async () => {
      await expect(service.completeTask("nonexistent-id")).rejects.toThrow(NotFoundError);
    });
  });
});
