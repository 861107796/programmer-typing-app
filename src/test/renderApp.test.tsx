import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import { TypingPanel } from "../components/TypingPanel";
import { getAllContent } from "../content/contentLibrary";
import { createSessionState } from "../engine/typingEngine";

async function renderAuthenticatedApp() {
  render(<App />);
  await screen.findByRole("heading", { name: /programmer typing trainer/i });
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

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: "u1",
            email: "dev@example.com",
            createdAt: "2026-05-05T10:00:00.000Z",
          },
        }),
      }),
    );
  });

  it("shows the auth form when no authenticated user is returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: null }),
      }),
    );

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

    await renderAuthenticatedApp();
    fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));

    const firstPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
    const textbox = screen.getByRole("textbox", { name: /typing input/i });

    typePrompt(textbox, firstPrompt);

    const secondPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    expect(firstPrompt).not.toBe(
      "const formatPrice = (value: number) => value.toFixed(2);",
    );
    expect(secondPrompt).not.toBe(firstPrompt);
  });

  it("logs out back to the auth form", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: "u1",
            email: "dev@example.com",
            createdAt: "2026-05-05T10:00:00.000Z",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

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
});
