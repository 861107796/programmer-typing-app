import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import { TypingPanel } from "../components/TypingPanel";
import { getAllContent } from "../content/contentLibrary";
import type {
  LeaderboardResponse,
  PersonalLeaderboardResponse,
  ProgressSnapshotResponse,
  SessionResult,
} from "../domain/types";
import { createSessionState } from "../engine/typingEngine";

const defaultUser = {
  id: "u1",
  email: "dev@example.com",
  createdAt: "2026-05-05T10:00:00.000Z",
};

const emptyProgress: ProgressSnapshotResponse = {
  sessions: [],
  achievements: [],
  dailyChallenge: null,
};

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

function createFetchMock(options?: {
  currentUser?: typeof defaultUser | null;
  progress?: ProgressSnapshotResponse;
  saveSessionResponse?: ProgressSnapshotResponse;
  saveSessionStatus?: number;
  dailyLeaderboard?: LeaderboardResponse;
  dailyLeaderboardStatus?: number;
  globalLeaderboard?: LeaderboardResponse;
  globalLeaderboardStatus?: number;
  myLeaderboard?: PersonalLeaderboardResponse;
  myLeaderboardStatus?: number;
}) {
  const currentUser =
    options && "currentUser" in options ? options.currentUser : defaultUser;
  const progress = options?.progress ?? emptyProgress;
  const saveSessionResponse = options?.saveSessionResponse ?? progress;
  const saveSessionStatus = options?.saveSessionStatus ?? 200;
  const dailyLeaderboard = options?.dailyLeaderboard ?? { entries: [] };
  const dailyLeaderboardStatus = options?.dailyLeaderboardStatus ?? 200;
  const globalLeaderboard = options?.globalLeaderboard ?? { entries: [] };
  const globalLeaderboardStatus = options?.globalLeaderboardStatus ?? 200;
  const myLeaderboard = options?.myLeaderboard ?? { daily: null, global: null };
  const myLeaderboardStatus = options?.myLeaderboardStatus ?? 200;

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === "/api/auth/me") {
      return jsonResponse({ user: currentUser });
    }

    if (url === "/api/progress") {
      return jsonResponse(progress);
    }

    if (url === "/api/sessions") {
      return jsonResponse(
        saveSessionResponse,
        saveSessionStatus >= 200 && saveSessionStatus < 300,
        saveSessionStatus,
      );
    }

    if (url === "/api/leaderboard/daily") {
      return jsonResponse(
        dailyLeaderboard,
        dailyLeaderboardStatus >= 200 && dailyLeaderboardStatus < 300,
        dailyLeaderboardStatus,
      );
    }

    if (url === "/api/leaderboard/global") {
      return jsonResponse(
        globalLeaderboard,
        globalLeaderboardStatus >= 200 && globalLeaderboardStatus < 300,
        globalLeaderboardStatus,
      );
    }

    if (url === "/api/leaderboard/me") {
      return jsonResponse(
        myLeaderboard,
        myLeaderboardStatus >= 200 && myLeaderboardStatus < 300,
        myLeaderboardStatus,
      );
    }

    if (url === "/api/auth/logout") {
      return jsonResponse({ ok: true });
    }

    if (url === "/api/auth/login" || url === "/api/auth/register") {
      return jsonResponse({ user: defaultUser });
    }

    throw new Error(`Unhandled fetch request: ${url} ${init?.method ?? "GET"}`);
  });
}

async function renderAuthenticatedApp() {
  render(<App />);
  await screen.findByRole("heading", { name: /programmer typing trainer/i });
  await screen.findByText(/sessions saved to cloud/i);
}

function getPromptByLabel(label: string) {
  return (
    getAllContent().find((item) => item.label === label)?.prompt ?? ""
  );
}

function typePrompt(textbox: HTMLElement, prompt: string) {
  for (const char of prompt) {
    if (char === "\n") {
      fireEvent.keyDown(textbox, { key: "Enter" });
      continue;
    }

    if (char === "\t") {
      fireEvent.keyDown(textbox, { key: "Tab" });
      continue;
    }

    fireEvent.change(textbox, { target: { value: char } });
  }
}

async function completeFocusedTechnicalPrompt() {
  fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "technical" },
  });

  const promptLabel =
    screen
      .getByTestId("prompt-text")
      .closest("section")
      ?.querySelector("h2")
      ?.textContent ?? "";
  const prompt = getPromptByLabel(promptLabel);

  fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
  const textbox = screen.getByRole("textbox", { name: /typing input/i });
  typePrompt(textbox, prompt);

  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: /session results/i }),
    ).toBeInTheDocument(),
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", createFetchMock());
  });

  it("shows the auth form when no authenticated user is returned", async () => {
    vi.stubGlobal("fetch", createFetchMock({ currentUser: null }));

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows the trainer when an authenticated user is returned", async () => {
    await renderAuthenticatedApp();

    expect(
      screen.getByRole("heading", { name: /programmer typing trainer/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dev@example.com/i)).toBeInTheDocument();
  });

  it("shows the product heading and progress sidebar", async () => {
    await renderAuthenticatedApp();

    expect(
      screen.getByRole("heading", { name: /programmer typing trainer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^daily challenge$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^recent sessions$/i }),
    ).toBeInTheDocument();
  });

  it("starts a practice session and shows the result after typing the prompt", async () => {
    await renderAuthenticatedApp();

    await completeFocusedTechnicalPrompt();
  });

  it("does not show the empty content message while seeded content exists", async () => {
    await renderAuthenticatedApp();

    expect(
      screen.queryByText(/no practice content available/i),
    ).not.toBeInTheDocument();
  });

  it("moves to a different prompt after pressing next in focused mode", async () => {
    await renderAuthenticatedApp();

    fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));

    const initialPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
    const textbox = screen.getByRole("textbox", { name: /typing input/i });

    typePrompt(textbox, initialPrompt);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /session results/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /skip prompt/i }));

    const nextPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    expect(nextPrompt).not.toBe(initialPrompt);
  });

  it("automatically continues to the next prompt after a completed run", async () => {
    await renderAuthenticatedApp();

    fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "technical" },
    });

    const initialPromptLabel =
      screen
        .getByTestId("prompt-text")
        .closest("section")
        ?.querySelector("h2")
        ?.textContent ?? "";
    const initialPrompt = getPromptByLabel(initialPromptLabel);

    fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
    const textbox = screen.getByRole("textbox", { name: /typing input/i });

    typePrompt(textbox, initialPrompt);

    await waitFor(() => {
      const nextPrompt =
        screen.getByTestId("prompt-text").textContent ?? "";
      expect(nextPrompt).not.toBe(initialPrompt);
    });
    expect(
      screen.queryByRole("button", { name: /start practice/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /typing input/i })).toBeInTheDocument();
  });

  it("uses a shuffled queue for focused mode instead of fixed array order", async () => {
    await renderAuthenticatedApp();

    vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9999);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));
    });

    const firstPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
    });
    const textbox = screen.getByRole("textbox", { name: /typing input/i });

    await act(async () => {
      typePrompt(textbox, firstPrompt);
    });

    const secondPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    expect(firstPrompt).not.toBe(
      "const formatPrice = (value: number) => value.toFixed(2);",
    );
    expect(secondPrompt).not.toBe(firstPrompt);
  });

  it("logs out back to the auth form", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /log out/i }));

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("accepts enter and tab as typing input for multiline prompts", () => {
    const onInput = vi.fn();
    const sessionState = createSessionState("line1\n\tline2");

    render(
      <TypingPanel
        content={{
          id: "test-multiline",
          category: "code",
          topic: "yaml",
          difficulty: "medium",
          length: "medium",
          label: "Multiline test",
          prompt: "line1\n\tline2",
        }}
        sessionState={sessionState}
        result={null}
        onStart={() => {}}
        onInput={onInput}
        onBackspace={() => {}}
      />,
    );

    const textbox = screen.getByRole("textbox", { name: /typing input/i });

    fireEvent.keyDown(textbox, { key: "Enter" });
    fireEvent.keyDown(textbox, { key: "Tab" });

    expect(onInput).toHaveBeenNthCalledWith(1, "\n");
    expect(onInput).toHaveBeenNthCalledWith(2, "\t");
  });

  it("hydrates sidebar progress from /api/progress after login", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        progress: {
          sessions: [
            {
              id: "session-1",
              mode: "mixed",
              category: "mixed",
              wpm: 75,
              accuracy: 99,
              errorCount: 1,
              durationMs: 20000,
              totalChars: 80,
              correctChars: 79,
              valid: true,
              createdAt: "2026-05-05T10:01:00.000Z",
            },
          ],
          achievements: [
            {
              id: "first-clean-run",
              progress: 1,
              unlocked: true,
              unlockedAt: "2026-05-05T10:01:00.000Z",
            },
          ],
          dailyChallenge: {
            dateKey: "2026-05-05",
            challengeId: "technical-api-001",
            completed: true,
            bestWpm: 75,
            bestAccuracy: 99,
          },
        },
      }),
    );

    render(<App />);

    expect(await screen.findByText(/1 unlocked/i)).toBeInTheDocument();
    expect(screen.getByText(/latest: 75 WPM/i)).toBeInTheDocument();
    expect(screen.getByText(/completed today/i)).toBeInTheDocument();
  });

  it("posts completed sessions and updates sidebar data from the backend response", async () => {
    const saveSessionResponse: ProgressSnapshotResponse = {
      sessions: [
        {
          id: "session-2",
          mode: "mixed",
          category: "technical",
          wpm: 88,
          accuracy: 100,
          errorCount: 0,
          durationMs: 15000,
          totalChars: 75,
          correctChars: 75,
          valid: true,
          createdAt: "2026-05-05T10:03:00.000Z",
        },
      ],
      achievements: [
        {
          id: "speed-runner",
          progress: 1,
          unlocked: true,
          unlockedAt: "2026-05-05T10:03:00.000Z",
        },
      ],
      dailyChallenge: null,
    };
    const fetchMock = createFetchMock({
      saveSessionResponse,
    });

    vi.stubGlobal("fetch", fetchMock);
    await renderAuthenticatedApp();

    await completeFocusedTechnicalPrompt();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/sessions",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(await screen.findByText(/latest: speed-runner/i)).toBeInTheDocument();
    expect(screen.getByText(/88 WPM/i)).toBeInTheDocument();
  });

  it("returns to the auth form when the session sync endpoint returns 401", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        saveSessionStatus: 401,
      }),
    );

    await renderAuthenticatedApp();

    await completeFocusedTechnicalPrompt();

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/session expired\. please sign in again\./i)).toBeInTheDocument();
  });

  it("renders the daily leaderboard after switching away from the trainer", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        dailyLeaderboard: {
          entries: [
            {
              rank: 1,
              displayName: "gamma",
              wpm: 92,
              accuracy: 100,
              recordedAt: "2026-05-05T10:12:00.000Z",
            },
          ],
        },
        globalLeaderboard: { entries: [] },
        myLeaderboard: {
          daily: {
            rank: 5,
            displayName: "dev",
            wpm: 74,
            accuracy: 97,
            recordedAt: "2026-05-05T10:15:00.000Z",
          },
          global: null,
        },
      }),
    );

    render(<App />);

    await screen.findByRole("heading", { name: /programmer typing trainer/i });
    fireEvent.click(screen.getByRole("button", { name: /^leaderboard$/i }));

    expect(
      await screen.findByRole("heading", {
        name: /daily challenge leaderboard/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^gamma$/i)).toBeInTheDocument();
    expect(screen.getByText(/my rank/i)).toBeInTheDocument();
  });

  it("switches to the global leaderboard tab and renders empty state text", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        dailyLeaderboard: { entries: [] },
        globalLeaderboard: {
          entries: [
            {
              rank: 1,
              displayName: "beta",
              wpm: 101,
              accuracy: 100,
              recordedAt: "2026-05-05T10:20:00.000Z",
            },
          ],
        },
        myLeaderboard: {
          daily: null,
          global: {
            rank: 12,
            displayName: "dev",
            wpm: 88,
            accuracy: 99,
            recordedAt: "2026-05-05T10:21:00.000Z",
          },
        },
      }),
    );

    render(<App />);
    await screen.findByRole("heading", { name: /programmer typing trainer/i });
    fireEvent.click(screen.getByRole("button", { name: /^leaderboard$/i }));

    expect(
      await screen.findByText(/no entries yet\. be the first to set a score\./i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^global$/i }));

    expect(await screen.findByText(/^beta$/i)).toBeInTheDocument();
    expect(screen.getByText(/12\. dev · 88 WPM · 99%/i)).toBeInTheDocument();
  });

  it("returns to sign in when a leaderboard request comes back unauthorized", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        dailyLeaderboardStatus: 401,
      }),
    );

    render(<App />);
    await screen.findByRole("heading", { name: /programmer typing trainer/i });
    fireEvent.click(screen.getByRole("button", { name: /^leaderboard$/i }));

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/session expired\. please sign in again\./i),
    ).toBeInTheDocument();
  });
});
