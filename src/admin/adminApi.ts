import type {
  AdminChallengeAssignment,
  AdminChallengeListResponse,
  AdminContentItem,
  AdminContentListResponse,
  BackendDailyChallengeResponse,
} from "../domain/types";

type AdminContentInput = Omit<
  AdminContentItem,
  "id" | "createdAt" | "updatedAt"
>;

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
  });

  if (response.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? `Admin request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchAdminContent(query = "") {
  return readJson<AdminContentListResponse>(`/api/admin/content${query}`);
}

export function createAdminContent(input: AdminContentInput) {
  return readJson<AdminContentItem>("/api/admin/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateAdminContent(id: string, input: AdminContentInput) {
  return readJson<AdminContentItem>(`/api/admin/content/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteAdminContent(id: string) {
  const response = await fetch(`/api/admin/content/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (response.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? `Admin request failed: ${response.status}`);
  }
}

export function fetchAdminDailyChallenges(dateKey?: string) {
  const query = dateKey ? `?date=${encodeURIComponent(dateKey)}` : "";
  return readJson<AdminChallengeListResponse>(
    `/api/admin/daily-challenge${query}`,
  );
}

export function assignAdminDailyChallenge(
  dateKey: string,
  contentItemId: string,
) {
  return readJson<AdminChallengeAssignment>(
    `/api/admin/daily-challenge/${dateKey}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentItemId }),
    },
  );
}

export function generateAdminDailyChallenge(dateKey?: string) {
  return readJson<AdminChallengeAssignment>(
    "/api/admin/daily-challenge/generate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dateKey ? { dateKey } : {}),
    },
  );
}

export function fetchBackendDailyChallenge() {
  return readJson<BackendDailyChallengeResponse>("/api/content/daily-challenge");
}
