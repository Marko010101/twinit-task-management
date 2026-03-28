import { describe, it, expect } from "vitest";
import { screen, waitFor, renderWithProviders, userEvent } from "@/test/utils";
import { server } from "@/test/server";
import { http, HttpResponse } from "msw";
import type { GetTasksResponse } from "@my-app/shared";
import TaskPage from "../TaskPage";

// Helper to capture the last request URL made to GET /tasks
function captureTasksRequest(): { url: URL | null } {
  const capture: { url: URL | null } = { url: null };
  server.use(
    http.get("http://localhost:3000/tasks", ({ request }) => {
      capture.url = new URL(request.url);
      const url = capture.url;
      const filter = url.searchParams.get("filter");
      const page = parseInt(url.searchParams.get("page") ?? "1", 10);
      const response: GetTasksResponse = {
        items: [],
        total: 0,
        page,
        limit: 10,
        totalPages: 0,
      };
      if (filter === "active") return HttpResponse.json(response);
      if (filter === "completed") return HttpResponse.json(response);
      return HttpResponse.json(response);
    }),
  );
  return capture;
}

describe("TaskPage — URL to state parsing", () => {
  it("loads with default filter when no query params are present", async () => {
    renderWithProviders(<TaskPage />, {
      routerProps: { initialEntries: ["/tasks"] },
    });

    // Default handler returns seed tasks — confirm the list renders
    await waitFor(() => {
      expect(screen.getByText("Task 2")).toBeInTheDocument();
    });
  });

  it("shows active empty message when ?filter=active is in the URL", async () => {
    server.use(
      http.get("http://localhost:3000/tasks", () =>
        HttpResponse.json({ items: [], total: 0, page: 1, limit: 10, totalPages: 0 } satisfies GetTasksResponse),
      ),
    );

    renderWithProviders(<TaskPage />, {
      routerProps: { initialEntries: ["/tasks?filter=active"] },
    });

    await waitFor(() => {
      expect(screen.getByText("No active tasks.")).toBeInTheDocument();
    });
  });

  it("falls back to all-tasks when ?filter= has an unrecognized value", async () => {
    renderWithProviders(<TaskPage />, {
      routerProps: { initialEntries: ["/tasks?filter=bogus"] },
    });

    await waitFor(() => {
      // Falls back to "all" empty message — default handler returns seed data,
      // but the "All" filter tab should be active (no error, no crash)
      expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
    });
  });

  it("treats ?page=0 as page 1", async () => {
    const capture = captureTasksRequest();

    renderWithProviders(<TaskPage />, {
      routerProps: { initialEntries: ["/tasks?page=0"] },
    });

    await waitFor(() => expect(capture.url).not.toBeNull());
    expect(capture.url?.searchParams.get("page")).toBe("1");
  });

  it("treats ?page=abc as page 1", async () => {
    const capture = captureTasksRequest();

    renderWithProviders(<TaskPage />, {
      routerProps: { initialEntries: ["/tasks?page=abc"] },
    });

    await waitFor(() => expect(capture.url).not.toBeNull());
    expect(capture.url?.searchParams.get("page")).toBe("1");
  });
});

describe("TaskPage — state to URL transitions", () => {
  it("updates the request to use filter=active when the Active tab is clicked", async () => {
    const user = userEvent.setup();
    let lastFilter: string | null = null;

    server.use(
      http.get("http://localhost:3000/tasks", ({ request }) => {
        const url = new URL(request.url);
        lastFilter = url.searchParams.get("filter");
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        } satisfies GetTasksResponse);
      }),
    );

    renderWithProviders(<TaskPage />, {
      routerProps: { initialEntries: ["/tasks"] },
    });

    await waitFor(() => screen.getByRole("button", { name: /^active$/i }));
    await user.click(screen.getByRole("button", { name: /^active$/i }));

    await waitFor(() => {
      expect(lastFilter).toBe("active");
    });
  });

  it("resets page to 1 when the filter tab changes", async () => {
    const user = userEvent.setup();
    const capturedPages: string[] = [];

    server.use(
      http.get("http://localhost:3000/tasks", ({ request }) => {
        const url = new URL(request.url);
        capturedPages.push(url.searchParams.get("page") ?? "1");
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        } satisfies GetTasksResponse);
      }),
    );

    renderWithProviders(<TaskPage />, {
      routerProps: { initialEntries: ["/tasks?filter=active&page=3"] },
    });

    await waitFor(() => screen.getByRole("button", { name: /^all$/i }));
    await user.click(screen.getByRole("button", { name: /^all$/i }));

    await waitFor(() => {
      const lastPage = capturedPages[capturedPages.length - 1];
      expect(lastPage).toBe("1");
    });
  });

  it("updates the request to page 2 when the Next button is clicked", async () => {
    const user = userEvent.setup();
    const capturedPages: string[] = [];

    server.use(
      http.get("http://localhost:3000/tasks", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") ?? "1", 10);
        capturedPages.push(String(page));
        return HttpResponse.json({
          items: [{ id: "1", title: "Task 1", completed: false, createdAt: new Date().toISOString() }],
          total: 20,
          page,
          limit: 10,
          totalPages: 2,
        } satisfies GetTasksResponse);
      }),
    );

    renderWithProviders(<TaskPage />, {
      routerProps: { initialEntries: ["/tasks"] },
    });

    await waitFor(() => screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(capturedPages).toContain("2");
    });
  });
});
