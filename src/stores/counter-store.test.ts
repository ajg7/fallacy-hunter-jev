import { beforeEach, describe, expect, it } from "vitest";
import { useCounterStore } from "./counter-store";

describe("useCounterStore", () => {
  beforeEach(() => {
    useCounterStore.getState().reset();
  });

  it("increments the count", () => {
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(1);
  });
});
