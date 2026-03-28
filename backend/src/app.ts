import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import taskRoutes from "./routes/task.routes";
import { NotFoundError, ValidationError } from "./errors";

const app = express();

const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(morganFormat));
}

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/tasks", taskRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
