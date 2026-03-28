import { describe, it, expect } from "vitest";
import { screen, waitFor, renderWithProviders, userEvent } from "@/test/utils";
import { server } from "@/test/server";
import { SEED_TASKS } from "@/test/handlers";
import { http, HttpResponse, delay } from "msw";
import type { TaskDto } from "@my-app/shared";
import { TaskItem } from "../TaskItem";
import { TaskList } from "../TaskList";

const completedTask: TaskDto = {
  id: "99",
  title: "Ship it",
  completed: true,
  createdAt: new Date(2026, 0, 1).toISOString(),
};

const activeTask: TaskDto = {
  id: "100",
  title: "Write tests",
  completed: false,
  createdAt: new Date(2026, 0, 1).toISOString(),
};

describe("TaskItem — completed task", () => {
  it("renders a disabled complete button with the completed aria-label", () => {
    renderWithProviders(<TaskItem task={completedTask} />);

    expect(screen.getByRole("button", { name: /task completed/i })).toBeDisabled();
  });

  it("renders the task title", () => {
    renderWithProviders(<TaskItem task={completedTask} />);

    expect(screen.getByText("Ship it")).toBeInTheDocument();
  });
});

describe("TaskItem — active task", () => {
  it("renders an enabled complete button with the mark as complete aria-label", () => {
    renderWithProviders(<TaskItem task={activeTask} />);

    expect(screen.getByRole("button", { name: /mark as complete/i })).not.toBeDisabled();
  });
});

// Optimistic update requires a mounted useTasks query so setQueriesData has a
// cache entry to update. TaskList is used as the wrapper because it calls useTasks,
// which populates the cache. When onMutate fires, it updates the cached items,
// causing TaskList to re-render and pass updated props down to TaskItem.
describe("TaskItem — optimistic complete via TaskList", () => {
  it("shows the task as completed before the server responds (optimistic)", async () => {
    // Use a 1s delay so the assertion window (200ms) clearly precedes the server response
    server.use(
      http.patch("http://localhost:3000/tasks/:id/complete", async () => {
        await delay(1000);
        return HttpResponse.json({ id: "2", title: "Task 2", completed: true, createdAt: new Date().toISOString() });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<TaskList filter="all" page={1} onPageChange={() => {}} />);

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /mark as complete/i }).length).toBeGreaterThan(0),
    );

    const completedCountBefore = screen.getAllByRole("button", { name: /task completed/i }).length;
    await user.click(screen.getAllByRole("button", { name: /mark as complete/i })[0]);

    // onMutate is async (awaits cancelQueries) so we use a short waitFor window (200ms)
    // to confirm the UI updated well before the 1000ms server delay — proving it's optimistic
    await waitFor(
      () => expect(screen.getAllByRole("button", { name: /task completed/i }).length).toBeGreaterThan(completedCountBefore),
      { timeout: 200 },
    );
  });

  it("reverts to active state when the complete API call fails", async () => {
    // Delay the 404 so the optimistic state (active count drops) is observable
    // before the rollback restores it
    server.use(
      http.patch("http://localhost:3000/tasks/:id/complete", async () => {
        await delay(300);
        return HttpResponse.json({ message: "Task not found" }, { status: 404 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<TaskList filter="all" page={1} onPageChange={() => {}} />);

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /mark as complete/i }).length).toBeGreaterThan(0),
    );

    const activeCountBefore = screen.getAllByRole("button", { name: /mark as complete/i }).length;
    await user.click(screen.getAllByRole("button", { name: /mark as complete/i })[0]);

    // Optimistic update fires before the 300ms server delay (observable within 200ms)
    await waitFor(
      () => expect(screen.getAllByRole("button", { name: /mark as complete/i }).length).toBeLessThan(activeCountBefore),
      { timeout: 200 },
    );

    // After 404 response + rollback, active count restores
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /mark as complete/i }).length).toBe(activeCountBefore);
    });
  });

  it("leaves the task permanently completed after a successful API response", async () => {
    // Stateful GET handler so the completed state persists after the re-sync refetch
    const completedIds = new Set<string>();

    server.use(
      http.get("http://localhost:3000/tasks", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") ?? "1", 10);
        const limit = 10;
        const items = SEED_TASKS.slice(0, limit).map((t) => ({
          ...t,
          completed: t.completed || completedIds.has(t.id),
        }));
        return HttpResponse.json({ items, total: SEED_TASKS.length, page, limit, totalPages: 2 });
      }),
      http.patch("http://localhost:3000/tasks/:id/complete", ({ params }) => {
        const id = params["id"] as string;
        completedIds.add(id);
        const task = SEED_TASKS.find((t) => t.id === id);
        if (!task) return HttpResponse.json({ message: "Not found" }, { status: 404 });
        return HttpResponse.json({ ...task, completed: true });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<TaskList filter="all" page={1} onPageChange={() => {}} />);

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /mark as complete/i }).length).toBeGreaterThan(0),
    );

    const activeCountBefore = screen.getAllByRole("button", { name: /mark as complete/i }).length;
    await user.click(screen.getAllByRole("button", { name: /mark as complete/i })[0]);

    // After successful response + re-sync refetch, active count stays permanently reduced
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /mark as complete/i }).length).toBeLessThan(activeCountBefore);
    });
  });
});
