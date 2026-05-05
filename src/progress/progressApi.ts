import type {
  ProgressSnapshotResponse,
  SessionResult,
} from "../domain/types";

export class ProgressApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function fetchProgressSnapshot() {
  const response = await fetch("/api/progress", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new ProgressApiError(
      `Progress bootstrap failed: ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as ProgressSnapshotResponse;
}

export async function saveCompletedSession(result: SessionResult) {
  const response = await fetch("/api/sessions", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new ProgressApiError(
      `Session sync failed: ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as ProgressSnapshotResponse;
}

export function isUnauthorizedProgressError(error: unknown) {
  return error instanceof ProgressApiError && error.status === 401;
}
