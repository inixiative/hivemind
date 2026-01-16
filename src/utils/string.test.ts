import { describe, test, expect } from "bun:test";
import { capitalize, reverse } from "./string";

describe("capitalize", () => {
  test("capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  test("handles already capitalized", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  test("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });

  test("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });
});

describe("reverse", () => {
  test("reverses a string", () => {
    expect(reverse("hello")).toBe("olleh");
  });

  test("handles empty string", () => {
    expect(reverse("")).toBe("");
  });

  test("handles palindrome", () => {
    expect(reverse("radar")).toBe("radar");
  });

  test("handles single character", () => {
    expect(reverse("x")).toBe("x");
  });
});
