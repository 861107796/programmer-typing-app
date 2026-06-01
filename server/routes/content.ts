import { Router } from "express";

import type { createContentService } from "../services/contentService";

interface ContentRouterDependencies {
  contentService: ReturnType<typeof createContentService>;
}

export function createContentRouter(dependencies: ContentRouterDependencies) {
  const router = Router();

  router.get("/session", async (request, response) => {
    try {
      const mode = request.query.mode === "focused" ? "focused" : "mixed";
      const category =
        typeof request.query.category === "string"
          ? request.query.category
          : undefined;

      response.json(
        await dependencies.contentService.getSessionContent(mode, category),
      );
    } catch (error) {
      const message = (error as Error).message;
      response
        .status(message === "Focused mode requires category" ? 400 : 500)
        .json({ error: message });
    }
  });

  router.get("/daily-challenge", async (_request, response) => {
    try {
      response.json(await dependencies.contentService.getDailyChallengeContent());
    } catch (error) {
      response.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
