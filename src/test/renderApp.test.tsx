import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "../App";

describe("App", () => {
  it("shows the product heading and start controls", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /programmer typing trainer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start practice/i }),
    ).toBeInTheDocument();
  });
});
