/**
 * @module @agentic-kanban/example-calculator
 *
 * A lightweight, type-safe arithmetic library providing the four fundamental
 * arithmetic operations: addition, subtraction, multiplication, and division.
 *
 * All functions accept and return plain JavaScript `number` values and are
 * tree-shakeable as individual named exports.
 *
 * @example
 * ```typescript
 * import { add, subtract, multiply, divide } from '@agentic-kanban/example-calculator';
 *
 * add(2, 3);        // 5
 * subtract(10, 4);  // 6
 * multiply(6, 7);   // 42
 * divide(15, 3);    // 5
 * ```
 */

/**
 * Adds two numbers together.
 *
 * @param a - The first number to add
 * @param b - The second number to add
 * @returns The sum of a and b
 *
 * @example
 * ```typescript
 * add(2, 3);     // 5
 * add(-1, -2);   // -3
 * add(5, 0);     // 5
 * ```
 */
export function add(a: number, b: number): number {
	return a + b;
}

/**
 * Subtracts the second number from the first.
 *
 * @param a - The number to subtract from (minuend)
 * @param b - The number to subtract (subtrahend)
 * @returns The difference of a minus b
 *
 * @example
 * ```typescript
 * subtract(5, 3);  // 2
 * subtract(3, 5);  // -2
 * ```
 */
export function subtract(a: number, b: number): number {
	return a - b;
}

/**
 * Multiplies two numbers together.
 *
 * @param a - The first number to multiply
 * @param b - The second number to multiply
 * @returns The product of a and b
 *
 * @example
 * ```typescript
 * multiply(3, 4);   // 12
 * multiply(5, 0);   // 0
 * multiply(-2, -3); // 6
 * ```
 */
export function multiply(a: number, b: number): number {
	return a * b;
}

/**
 * Divides the first number by the second.
 *
 * @param a - The dividend (number to be divided)
 * @param b - The divisor (number to divide by)
 * @returns The quotient of a divided by b
 * @throws {Error} When b is zero (division by zero)
 *
 * @example
 * ```typescript
 * divide(10, 2);  // 5
 * divide(7, 2);   // 3.5
 *
 * // Division by zero throws an error
 * divide(5, 0);   // throws Error: "Cannot divide by zero"
 * ```
 */
export function divide(a: number, b: number): number {
	if (b === 0) {
		throw new Error("Cannot divide by zero");
	}
	return a / b;
}
