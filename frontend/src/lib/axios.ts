import axios, { isAxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Normalize all API errors to plain Error instances at the transport boundary.
// Callers receive error.message without needing to know about AxiosError internals.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError<{ message?: string }>(error)) {
      const message =
        error.response?.data?.message ?? error.message ?? "An unexpected error occurred";
      console.error("API Error:", message);
      return Promise.reject(new Error(message));
    }
    console.error("Unexpected error:", error);
    return Promise.reject(error instanceof Error ? error : new Error("An unexpected error occurred"));
  },
);
