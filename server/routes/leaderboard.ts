import { Router } from "express";

import type { AuthenticatedRequest } from "../middleware/auth";
import type { createLeaderboardService } from "../services/leaderboardService";

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

interface LeaderboardRouterDependencies {
  leaderboardService: ReturnType<typeof createLeaderboardService>;
}

export function createLeaderboardRouter(
  dependencies: LeaderboardRouterDependencies,
) {
  const router = Router();

  router.get("/daily", async (request: AuthenticatedRequest, response) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    response.json(
      await dependencies.leaderboardService.getDailyLeaderboard(getDateKey()),
    );
  });

  router.get("/global", async (request: AuthenticatedRequest, response) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    response.json(
      await dependencies.leaderboardService.getGlobalLeaderboard(),
    );
  });

  router.get("/me", async (request: AuthenticatedRequest, response) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    response.json(
      await dependencies.leaderboardService.getMyLeaderboardSummary(
        request.authUserId,
        getDateKey(),
      ),
    );
  });

  return router;
}
