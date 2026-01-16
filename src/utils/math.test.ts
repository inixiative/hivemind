import { describe, expect, test } from "bun:test";
import { add, subtract } from "./math";

describe("math utilities", () => {
  describe("add", () => {
    test("adds two positive numbers", () => {
      expect(add(2, 3)).toBe(5);
    });

    test("adds negative numbers", () => {
      expect(add(-1, -2)).toBe(-3);
    });

    test("adds zero", () => {
      expect(add(5, 0)).toBe(5);
    });
  });

  describe("subtract", () => {
    test("subtracts two positive numbers", () => {
      expect(subtract(5, 3)).toBe(2);
    });

    test("subtracts resulting in negative", () => {
      expect(subtract(3, 5)).toBe(-2);
    });

    test("subtracts zero", () => {
      expect(subtract(5, 0)).toBe(5);
    });
  });
});
