import { Router } from "express";

import { config } from "../config";
import type { AuthenticatedRequest } from "../middleware/auth";
import type { UserRecord } from "../types/auth";
import { toPublicUser } from "../services/authService";

interface AuthRouterDependencies {
  register: (router: Router) => void;
  login: (router: Router) => void;
  getCurrentUser: (request: AuthenticatedRequest) => Promise<UserRecord | null>;
}

export function createAuthRouter(dependencies: AuthRouterDependencies) {
  const router = Router();

  dependencies.register(router);
  dependencies.login(router);

  router.post("/logout", (_request, response) => {
    response.clearCookie(config.authCookieName);
    response.status(200).json({ ok: true });
  });

  router.get("/me", async (request: AuthenticatedRequest, response) => {
    const user = await dependencies.getCurrentUser(request);

    response.status(200).json({
      user: user ? toPublicUser(user) : null,
    });
  });

  return router;
}
