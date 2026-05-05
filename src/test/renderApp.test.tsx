import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import { TypingPanel } from "../components/TypingPanel";
import { createSessionState } from "../engine/typingEngine";

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the product heading and progress sidebar", () => {
    render(<App />);

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

  it("starts a practice session and shows the result after typing the prompt", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
    const textbox = screen.getByRole("textbox", { name: /typing input/i });
    const prompt = screen.getByTestId("prompt-text").textContent ?? "";

    for (const char of prompt) {
      fireEvent.change(textbox, { target: { value: char } });
    }

    expect(
      screen.getByRole("heading", { name: /session results/i }),
    ).toBeInTheDocument();
  });

  it("does not show the empty content message while seeded content exists", () => {
    render(<App />);

    expect(
      screen.queryByText(/no practice content available/i),
    ).not.toBeInTheDocument();
  });

  it("moves to a different prompt after pressing next in focused mode", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));

    const initialPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
    const textbox = screen.getByRole("textbox", { name: /typing input/i });

    for (const char of initialPrompt) {
      fireEvent.change(textbox, { target: { value: char } });
    }

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /session results/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /skip prompt/i }));

    const nextPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    expect(nextPrompt).not.toBe(initialPrompt);
  });

  it("automatically continues to the next prompt after a completed run", () => {
    render(<App />);

    const initialPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
    const textbox = screen.getByRole("textbox", { name: /typing input/i });

    for (const char of initialPrompt) {
      fireEvent.change(textbox, { target: { value: char } });
    }

    const nextPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    expect(nextPrompt).not.toBe(initialPrompt);
    expect(
      screen.queryByRole("button", { name: /start practice/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /typing input/i })).toBeInTheDocument();
  });

  it("uses a shuffled queue for focused mode instead of fixed array order", () => {
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

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));

    const firstPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
    const textbox = screen.getByRole("textbox", { name: /typing input/i });

    for (const char of firstPrompt) {
      fireEvent.change(textbox, { target: { value: char } });
    }

    const secondPrompt = screen.getByTestId("prompt-text").textContent ?? "";

    expect(firstPrompt).not.toBe(
      "const formatPrice = (value: number) => value.toFixed(2);",
    );
    expect(secondPrompt).not.toBe(firstPrompt);
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
