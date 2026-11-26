import { describe, it, expect } from "vitest";

describe("QA infrastructure", () => {
  it("supports isolated browser storage", () => {
    localStorage.setItem("cic-test", "synthetic");

    expect(localStorage.getItem("cic-test"))
      .toBe("synthetic");

    localStorage.removeItem("cic-test");

    expect(localStorage.getItem("cic-test"))
      .toBeNull();
  });
});