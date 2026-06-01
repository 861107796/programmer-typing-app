import type {
  BackendDailyChallengeResponse,
  ContentItem,
  PracticeCategory,
} from "../domain/types";

async function parseContentResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }

  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Content request failed");
  }

  return payload as T;
}

export async function fetchSessionContent(
  mode: "mixed" | "focused",
  category?: PracticeCategory,
): Promise<{ items: ContentItem[] }> {
  const query =
    mode === "focused"
      ? `/api/content/session?mode=focused&category=${encodeURIComponent(category ?? "")}`
      : "/api/content/session?mode=mixed";

  const response = await fetch(query);
  return parseContentResponse<{ items: ContentItem[] }>(response);
}

export async function fetchBackendDailyChallenge() {
  const response = await fetch("/api/content/daily-challenge");
  return parseContentResponse<BackendDailyChallengeResponse>(response);
}
