import cookieParser from "cookie-parser";
import express from "express";

import { config } from "./config";
import { createDatabase } from "./db/client";
import { initDatabase } from "./db/init";

export async function createApp() {
  const db = await createDatabase();
  await initDatabase(db);

  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/auth/me", (_request, response) => {
    response.status(200).json({ user: null });
  });

  return app;
}

export { config };
