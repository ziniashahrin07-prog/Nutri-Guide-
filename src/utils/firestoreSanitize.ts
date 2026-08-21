/**
 * Utility to sanitize data structures before writing to Firestore.
 * Firestore strictly disallows `undefined` values and throws runtime exceptions.
 * This helper strips `undefined` recursively while preserving Arrays, Dates, nulls, booleans, numbers, and strings.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        sanitizedObj[key] = sanitizeForFirestore(value);
      }
    }
    return sanitizedObj as T;
  }

  return data;
}
