/**
 * Sanitize a label for use in IDs
 * - lowercase
 * - remove special chars (keep alphanumeric only)
 * - max 20 chars
 */
export function sanitizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}
