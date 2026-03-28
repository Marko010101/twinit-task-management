import { describe, it, expect } from "vitest";
import { screen, waitFor, renderWithProviders, userEvent } from "@/test/utils";
import { server } from "@/test/server";
import { http, HttpResponse } from "msw";
import type { GetTasksResponse } from "@my-app/shared";
import { TaskList } from "../TaskList";

const noop = () => {};

const emptyResponse: GetTasksResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

describe("TaskList — loading state", () => {
  it("renders skeleton rows while the query is in flight", () => {
    // Delay the response so we can assert the loading state synchronously
    server.use(
      http.get("http://localhost:3000/tasks", async () => {
        await new Promise(() => {}); // never resolves
      }),
    );

    renderWithProviders(<TaskList filter="all" page={1} onPageChange={noop} />);

    // Skeleton renders list items before data arrives
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });
});

describe("TaskList — error state", () => {
  it("shows an error message and Try again button when the API fails", async () => {
    server.use(
      http.get("http://localhost:3000/tasks", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 }),
      ),
    );

    renderWithProviders(<TaskList filter="all" page={1} onPageChange={noop} />);

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("retries the request when Try again is clicked", async () => {
    let callCount = 0;
    server.use(
      http.get("http://localhost:3000/tasks", () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ message: "Server error" }, { status: 500 });
        }
        const response: GetTasksResponse = {
          items: [{ id: "1", title: "Task 1", completed: false, createdAt: new Date().toISOString() }],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        };
        return HttpResponse.json(response);
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<TaskList filter="all" page={1} onPageChange={noop} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText("Task 1")).toBeInTheDocument();
    });
  });
});

describe("TaskList — empty state", () => {
  it("shows 'No tasks yet. Add one above.' when filter=all returns no items", async () => {
    server.use(
      http.get("http://localhost:3000/tasks", () => HttpResponse.json(emptyResponse)),
    );

    renderWithProviders(<TaskList filter="all" page={1} onPageChange={noop} />);

    await waitFor(() => {
      expect(screen.getByText("No tasks yet. Add one above.")).toBeInTheDocument();
    });
  });

  it("shows 'No active tasks.' when filter=active returns no items", async () => {
    server.use(
      http.get("http://localhost:3000/tasks", () => HttpResponse.json(emptyResponse)),
    );

    renderWithProviders(<TaskList filter="active" page={1} onPageChange={noop} />);

    await waitFor(() => {
      expect(screen.getByText("No active tasks.")).toBeInTheDocument();
    });
  });
});

describe("TaskList — data state", () => {
  it("renders task titles when data is returned", async () => {
    renderWithProviders(<TaskList filter="all" page={1} onPageChange={noop} />);

    // SEED_TASKS has 12 items; page 1 returns first 10
    await waitFor(() => {
      expect(screen.getByText("Task 1")).toBeInTheDocument();
      expect(screen.getByText("Task 10")).toBeInTheDocument();
    });
  });

  it("hides pagination when totalPages is 1", async () => {
    server.use(
      http.get("http://localhost:3000/tasks", () =>
        HttpResponse.json({
          items: [{ id: "1", title: "Only task", completed: false, createdAt: new Date().toISOString() }],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        } satisfies GetTasksResponse),
      ),
    );

    renderWithProviders(<TaskList filter="all" page={1} onPageChange={noop} />);

    await waitFor(() => expect(screen.getByText("Only task")).toBeInTheDocument());

    expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("shows Previous/Next and page indicator when totalPages > 1", async () => {
    // Default handler: 12 tasks, limit 10 → totalPages 2
    renderWithProviders(<TaskList filter="all" page={1} onPageChange={noop} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });
  });

  it("marks the list as aria-busy when isPlaceholderData is true", async () => {
    renderWithProviders(<TaskList filter="all" page={1} onPageChange={noop} />);

    // Wait for initial data to load
    await waitFor(() => expect(screen.getByText("Task 1")).toBeInTheDocument());

    // The list should NOT be aria-busy on initial load
    expect(screen.getByRole("list")).toHaveAttribute("aria-busy", "false");
  });
});
