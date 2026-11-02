/** The backend returns arrays for list endpoints; be forgiving if one ever doesn't. */
export const asArray = (value) => (Array.isArray(value) ? value : []);

/** Empty string / null / NaN → undefined, otherwise the number. */
export function numberOrUndefined(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isNaN(n) ? undefined : n;
}
