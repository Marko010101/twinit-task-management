import { Request, Response, NextFunction } from "express";
import { CreateTaskRequest, GetTasksQuery, TaskFilter } from "@my-app/shared";
import { taskService } from "../services/task.service";
import { ValidationError } from "../errors";

const VALID_FILTERS: readonly TaskFilter[] = ["all", "active", "completed"];

function isTaskFilter(value: string): value is TaskFilter {
  return (VALID_FILTERS as readonly string[]).includes(value);
}

export const taskController = {
  async getTasks(
    req: Request<Record<string, never>, unknown, unknown, GetTasksQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rawFilter = req.query.filter ?? "all";
      if (!isTaskFilter(rawFilter)) {
        next(new ValidationError(`Invalid filter "${rawFilter}". Must be one of: ${VALID_FILTERS.join(", ")}`));
        return;
      }
      const page = req.query.page !== undefined ? Number(req.query.page) : undefined;
      const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
      res.json(await taskService.getTasks(rawFilter, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async createTask(
    req: Request<Record<string, never>, unknown, CreateTaskRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { title } = req.body;
      res.status(201).json(await taskService.createTask({ title }));
    } catch (err) {
      next(err);
    }
  },

  async completeTask(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      res.json(await taskService.completeTask(req.params.id));
    } catch (err) {
      next(err);
    }
  },
};
