import { NotFoundPage } from "@/pages/NotFoundPage";
import TaskPage from "@/pages/TaskPage";
import { createBrowserRouter, Navigate } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/tasks" replace />,
  },
  {
    path: "/tasks",
    element: <TaskPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
