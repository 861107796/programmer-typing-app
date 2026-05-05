import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "../App";

describe("App", () => {
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
});
