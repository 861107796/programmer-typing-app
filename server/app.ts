import cookieParser from "cookie-parser";
import express from "express";

import { config } from "./config";
import { createDatabase } from "./db/client";
import { initDatabase } from "./db/init";
import {
  authMiddleware,
  type AuthenticatedRequest,
} from "./middleware/auth";
import { createUserRepository } from "./repositories/userRepository";
import { createAuthRouter } from "./routes/auth";
import {
  hashPassword,
  normalizeEmail,
  signUserToken,
  validateCredentials,
  verifyPassword,
} from "./services/authService";

interface CreateAppOptions {
  databasePath?: string;
}

export async function createApp(options: CreateAppOptions = {}) {
  const databasePath = options.databasePath ?? config.databasePath;
  const db = await createDatabase(databasePath);
  await initDatabase(db);
  const userRepository = createUserRepository(db);

  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(authMiddleware);

  const authRouter = createAuthRouter({
    register(router) {
      router.post("/register", async (request, response, next) => {
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
    login(router) {
      router.post("/login", async (request, response) => {
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

      return userRepository.findById(request.authUserId);
    },
  });

  app.use("/api/auth", authRouter);

  app.use((_error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(500).json({ error: "Internal server error" });
  });

  return app;
}

export { config };
