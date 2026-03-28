import { describe, it, expect } from "vitest";
import { screen, waitFor, renderWithProviders, userEvent } from "@/test/utils";
import { TaskForm } from "../TaskForm";
import { server } from "@/test/server";
import { http, HttpResponse, delay } from "msw";

describe("TaskForm", () => {
  it("renders a disabled Add button when input is empty", () => {
    renderWithProviders(<TaskForm />);

    expect(screen.getByRole("button", { name: /add/i })).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("enables Add button when the user types a non-empty title", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    await user.type(screen.getByRole("textbox"), "Buy milk");

    expect(screen.getByRole("button", { name: /add/i })).not.toBeDisabled();
  });

  it("does not submit when input contains only whitespace", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    // Button stays disabled for whitespace-only input
    await user.type(screen.getByRole("textbox"), "   ");

    expect(screen.getByRole("button", { name: /add/i })).toBeDisabled();
  });

  it("clears the input after successful task creation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    await user.type(screen.getByRole("textbox"), "Buy milk");
    await user.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("");
    });
  });

  it("shows an error message when the API returns 400", async () => {
    server.use(
      http.post("http://localhost:3000/tasks", () =>
        HttpResponse.json({ message: "Title is required" }, { status: 400 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    await user.type(screen.getByRole("textbox"), "   x");
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "anything");
    await user.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });
  });

  it("clears the error message when the user starts typing after an error", async () => {
    server.use(
      http.post("http://localhost:3000/tasks", () =>
        HttpResponse.json({ message: "Title is required" }, { status: 400 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    await user.type(screen.getByRole("textbox"), "bad");
    await user.click(screen.getByRole("button", { name: /add/i }));
    await waitFor(() => expect(screen.getByText("Title is required")).toBeInTheDocument());

    await user.type(screen.getByRole("textbox"), "x");

    expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
  });

  it("disables input and button while submission is pending", async () => {
    server.use(
      http.post("http://localhost:3000/tasks", async () => {
        await delay(500);
        return HttpResponse.json({
          id: "1",
          title: "Test",
          completed: false,
          createdAt: new Date().toISOString(),
        }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    await user.type(screen.getByRole("textbox"), "New task");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /add/i })).toBeDisabled();
  });
});
