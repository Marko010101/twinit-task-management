import { Router } from "express";
import { taskController } from "../controllers/task.controller";

const router = Router();

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.patch("/:id/complete", taskController.completeTask);

export default router;
