import cookieParser from "cookie-parser";
import express from "express";

import { config } from "./config";
import { createDatabase } from "./db/client";
import { initDatabase } from "./db/init";
import { createUserRepository } from "./repositories/userRepository";
import {
  hashPassword,
  normalizeEmail,
  signUserToken,
  toPublicUser,
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

  app.post("/api/auth/register", async (request, response) => {
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
      response.status(201).json({ user: toPublicUser(user) });
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

      response.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (request, response) => {
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
    response.status(200).json({ user: toPublicUser(user) });
  });

  app.get("/api/auth/me", (_request, response) => {
    response.status(200).json({ user: null });
  });

  return app;
}

export { config };
