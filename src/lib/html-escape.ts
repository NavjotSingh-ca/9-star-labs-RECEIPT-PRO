/**
 * HTML-escapes a string for safe rendering in email templates and HTML contexts.
 * Escapes: & < > " '
 *
 * @param str - The string to escape. Null/undefined returns empty string.
 * @returns The HTML-safe string.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
