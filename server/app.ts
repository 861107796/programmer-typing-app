import cookieParser from "cookie-parser";
import express, {
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from "express";

import { config } from "./config";
import { createDatabase } from "./db/client";
import { initDatabase } from "./db/init";
import {
  authMiddleware,
  type AuthenticatedRequest,
} from "./middleware/auth";
import { createAchievementRepository } from "./repositories/achievementRepository";
import { createChallengeAssignmentRepository } from "./repositories/challengeAssignmentRepository";
import { createContentRepository } from "./repositories/contentRepository";
import { createDailyChallengeRepository } from "./repositories/dailyChallengeRepository";
import { createLeaderboardRepository } from "./repositories/leaderboardRepository";
import { createSessionRepository } from "./repositories/sessionRepository";
import { createUserRepository } from "./repositories/userRepository";
import { createAdminRouter } from "./routes/admin";
import { createAuthRouter } from "./routes/auth";
import { createContentRouter } from "./routes/content";
import { createLeaderboardRouter } from "./routes/leaderboard";
import { createProgressRouter } from "./routes/progress";
import {
  hashPassword,
  normalizeEmail,
  signUserToken,
  validateCredentials,
  verifyPassword,
} from "./services/authService";
import { createContentService } from "./services/contentService";
import { createLeaderboardService } from "./services/leaderboardService";
import { createProgressService } from "./services/progressService";

interface CreateAppOptions {
  databasePath?: string;
}

export async function createApp(options: CreateAppOptions = {}) {
  const databasePath = options.databasePath ?? config.databasePath;
  const db = await createDatabase(databasePath);
  await initDatabase(db);
  const userRepository = createUserRepository(db);
  const sessionRepository = createSessionRepository(db);
  const achievementRepository = createAchievementRepository(db);
  const dailyChallengeRepository = createDailyChallengeRepository(db);
  const contentRepository = createContentRepository(db);
  const challengeAssignmentRepository = createChallengeAssignmentRepository(db);
  const leaderboardRepository = createLeaderboardRepository(db);
  const progressService = createProgressService({
    sessionRepository,
    achievementRepository,
    dailyChallengeRepository,
  });
  const contentService = createContentService({
    contentRepository,
    challengeAssignmentRepository,
  });
  const leaderboardService = createLeaderboardService({
    leaderboardRepository,
  });

  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(authMiddleware);

  const authRouter = createAuthRouter({
    register(router: Router) {
      router.post("/register", async (request: Request, response: Response, next: NextFunction) => {
        try {
          const { normalizedEmail, password } = validateCredentials(
            request.body.email ?? "",
            request.body.password ?? "",
          );

          if (await userRepository.findByEmail(normalizedEmail)) {
            response.status(409).json({ error: "Email already registered" });
            return;
          }

          const passwordHash = await hashPassword(password);
          const user = await userRepository.create(normalizedEmail, passwordHash);
          const token = signUserToken(user);

          response.cookie(config.authCookieName, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
          });
          response.status(201).json({
            user: {
              id: user.id,
              email: user.email,
              createdAt: user.created_at,
            },
          });
        } catch (error) {
          if (error instanceof Error && error.message === "Invalid email") {
            response.status(400).json({ error: "Invalid email" });
            return;
          }

          if (
            error instanceof Error &&
            error.message === "Password must be at least 8 characters"
          ) {
            response.status(400).json({ error: error.message });
            return;
          }

          next(error);
        }
      });
    },
    login(router: Router) {
      router.post("/login", async (request: Request, response: Response) => {
        const email = normalizeEmail(request.body.email ?? "");
        const password = String(request.body.password ?? "");
        const user = await userRepository.findByEmail(email);

        if (!user || !(await verifyPassword(password, user.password_hash))) {
          response.status(401).json({ error: "Invalid credentials" });
          return;
        }

        const token = signUserToken(user);
        response.cookie(config.authCookieName, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
        });
        response.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.created_at,
          },
        });
      });
    },
    async getCurrentUser(request: AuthenticatedRequest) {
      if (!request.authUserId) {
        return null;
      }

      return (await userRepository.findById(request.authUserId)) ?? null;
    },
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin", createAdminRouter({ contentService }));
  app.use("/api/content", createContentRouter({ contentService }));
  app.use("/api", createProgressRouter({ progressService }));
  app.use("/api/leaderboard", createLeaderboardRouter({ leaderboardService }));

  app.use((_error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(500).json({ error: "Internal server error" });
  });

  return app;
}

export { config };
