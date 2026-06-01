import { Router } from "express";

import type { AuthenticatedRequest } from "../middleware/auth";
import type { createContentService } from "../services/contentService";

interface AdminRouterDependencies {
  contentService: ReturnType<typeof createContentService>;
}

export function createAdminRouter(dependencies: AdminRouterDependencies) {
  const router = Router();

  router.use((request: AuthenticatedRequest, response, next) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    next();
  });

  router.get("/content", async (request, response) => {
    const items = await dependencies.contentService.listContent({
      category:
        typeof request.query.category === "string"
          ? request.query.category
          : undefined,
      topic:
        typeof request.query.topic === "string"
          ? request.query.topic
          : undefined,
      difficulty:
        typeof request.query.difficulty === "string"
          ? request.query.difficulty
          : undefined,
      length:
        typeof request.query.length === "string"
          ? request.query.length
          : undefined,
      isActive:
        typeof request.query.is_active === "string"
          ? request.query.is_active === "true"
          : undefined,
    });

    response.json({ items });
  });

  router.post("/content", async (request, response) => {
    try {
      const item = await dependencies.contentService.createContent(request.body);
      response.status(201).json(item);
    } catch (error) {
      response.status(400).json({ error: (error as Error).message });
    }
  });

  router.put("/content/:id", async (request, response) => {
    try {
      const item = await dependencies.contentService.updateContent(
        request.params.id,
        request.body,
      );
      response.status(200).json(item);
    } catch (error) {
      const message = (error as Error).message;
      response
        .status(message === "Content not found" ? 404 : 400)
        .json({ error: message });
    }
  });

  router.delete("/content/:id", async (request, response) => {
    try {
      await dependencies.contentService.deleteContent(request.params.id);
      response.status(204).send();
    } catch (error) {
      const message = (error as Error).message;
      response
        .status(
          message === "Prompt is assigned to a daily challenge" ? 409 : 400,
        )
        .json({
          error: message,
        });
    }
  });

  router.get("/daily-challenge", async (request, response) => {
    const date =
      typeof request.query.date === "string" ? request.query.date : undefined;
    const assignments = await dependencies.contentService.listAssignments(date);
    response.json({ assignments });
  });

  router.put("/daily-challenge/:dateKey", async (request, response) => {
    try {
      const assignment =
        await dependencies.contentService.assignDailyChallenge(
          request.params.dateKey,
          String(request.body.contentItemId ?? ""),
        );
      response.status(200).json(assignment);
    } catch (error) {
      const message = (error as Error).message;
      response
        .status(message === "Content not found" ? 404 : 400)
        .json({ error: message });
    }
  });

  router.post("/daily-challenge/generate", async (request, response) => {
    try {
      const assignment = await dependencies.contentService.generateDailyChallenge(
        typeof request.body.dateKey === "string"
          ? request.body.dateKey
          : undefined,
      );
      response.status(200).json(assignment);
    } catch (error) {
      response.status(400).json({ error: (error as Error).message });
    }
  });

  return router;
}
