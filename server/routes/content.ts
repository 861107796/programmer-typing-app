import { Router } from "express";

import type { createContentService } from "../services/contentService";

interface ContentRouterDependencies {
  contentService: ReturnType<typeof createContentService>;
}

export function createContentRouter(dependencies: ContentRouterDependencies) {
  const router = Router();

  router.get("/daily-challenge", async (_request, response) => {
    try {
      response.json(await dependencies.contentService.getDailyChallengeContent());
    } catch (error) {
      response.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
