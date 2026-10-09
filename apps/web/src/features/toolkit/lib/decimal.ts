/** Toolkit input syntax only; credit, grade and aggregation rules belong to each calculator. */
export function parseToolkitDecimal(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) return null;
  const number = Number(text.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}
