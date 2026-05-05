import type { NextFunction, Request, Response } from "express";

import { config } from "../config";
import { verifyUserToken } from "../services/authService";

export interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

export function authMiddleware(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
) {
  const token = request.cookies[config.authCookieName];

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyUserToken(token);
    request.authUserId = payload.sub;
  } catch {
    request.authUserId = undefined;
  }

  next();
}
