/**
 * String utility functions
 */

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Reverses a string
 */
export function reverse(str: string): string {
  return str.split("").reverse().join("");
}
