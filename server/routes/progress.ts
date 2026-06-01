import { Router } from "express";

import type { AuthenticatedRequest } from "../middleware/auth";
import type { createProgressService } from "../services/progressService";

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

interface ProgressRouterDependencies {
  progressService: ReturnType<typeof createProgressService>;
}

export function createProgressRouter(dependencies: ProgressRouterDependencies) {
  const router = Router();

  router.get("/progress", async (request: AuthenticatedRequest, response) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    const snapshot = await dependencies.progressService.getProgressSnapshot(
      request.authUserId,
      getDateKey(),
    );

    response.status(200).json(snapshot);
  });

  router.post("/sessions", async (request: AuthenticatedRequest, response) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    const snapshot = await dependencies.progressService.saveSession(
      request.authUserId,
      request.body,
      getDateKey(),
    );

    response.status(201).json(snapshot);
  });

  return router;
}
