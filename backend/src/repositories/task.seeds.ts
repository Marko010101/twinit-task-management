import { TaskDto } from "@my-app/shared";

export const SEED_TASKS: readonly TaskDto[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Set up NPM Workspace",
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Define shared TypeScript models",
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Implement Layered Architecture backend",
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    title: "Create in-memory repository",
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    title: "Write business logic in Service layer",
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    title: "Build Express controllers and routes",
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    title: "Write Jest unit tests (No mocking)",
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    title: "Write Supertest integration tests",
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    title: "Implement server-side pagination",
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "Scaffold Vite + React frontend",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    title: "Create API service helper in React",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    title: "Build TaskList UI component",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    title: "Implement pagination buttons in UI",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    title: "Add loading and error states (Bonus)",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    title: "Write architecture README and submit",
    completed: false,
    createdAt: new Date().toISOString(),
  },
];
