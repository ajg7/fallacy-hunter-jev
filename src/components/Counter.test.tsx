import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useCounterStore } from "@/stores/counter-store";
import { Counter } from "./Counter";

describe("Counter", () => {
  beforeEach(() => {
    useCounterStore.getState().reset();
  });

  it("increments when clicked", async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole("button", { name: "Count is 0" }));

    expect(
      screen.getByRole("button", { name: "Count is 1" }),
    ).toBeInTheDocument();
  });
});
