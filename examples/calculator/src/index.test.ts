import { describe, expect, test } from "bun:test";
import { add, subtract, multiply, divide } from "./index";

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
	test("subtracts two numbers", () => {
		expect(subtract(5, 3)).toBe(2);
	});

	test("returns negative result", () => {
		expect(subtract(3, 5)).toBe(-2);
	});
});

describe("multiply", () => {
	test("multiplies two numbers", () => {
		expect(multiply(3, 4)).toBe(12);
	});

	test("multiplies by zero", () => {
		expect(multiply(5, 0)).toBe(0);
	});

	test("multiplies negative numbers", () => {
		expect(multiply(-2, -3)).toBe(6);
	});
});

describe("divide", () => {
	test("divides two numbers", () => {
		expect(divide(10, 2)).toBe(5);
	});

	test("returns decimal result", () => {
		expect(divide(7, 2)).toBe(3.5);
	});

	test("throws on division by zero", () => {
		expect(() => divide(5, 0)).toThrow("Cannot divide by zero");
	});
});
