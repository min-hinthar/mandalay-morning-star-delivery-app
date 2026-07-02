/**
 * Escape the five HTML-significant characters so untrusted text can be safely interpolated into an HTML
 * string. Use at every sink where customer-controlled data (delivery address, item names, free text) is
 * concatenated into markup that reaches `dangerouslySetInnerHTML` or an email `html` body — plain React
 * children and template props do NOT need this (React auto-escapes those).
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
