import "@testing-library/jest-dom/vitest";
import { beforeAll, afterEach, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup(); // RTL auto-cleanup doesn't fire with globals:false — call it manually
  server.resetHandlers();
});
afterAll(() => server.close());
