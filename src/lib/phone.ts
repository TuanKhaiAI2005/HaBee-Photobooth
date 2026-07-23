export function normalizeVietnamPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s.-]/g, "");
  const digits = compact.startsWith("+") ? compact.slice(1) : compact;

  if (!/^\d+$/.test(digits)) {
    return null;
  }

  let nationalNumber: string;

  if (/^[1-9]\d{8}$/.test(digits)) {
    nationalNumber = digits;
  } else if (digits.startsWith("0")) {
    nationalNumber = digits.slice(1);
  } else if (digits.startsWith("84")) {
    nationalNumber = digits.slice(2);
  } else {
    return null;
  }

  if (!/^[1-9]\d{8}$/.test(nationalNumber)) {
    return null;
  }

  return `+84${nationalNumber}`;
}
