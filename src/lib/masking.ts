export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return parts[0] ?? "";
  }

  return [...parts.slice(0, -1).map(() => "****"), parts.at(-1)].join(" ");
}

export function maskPhone(phone: string): string {
  const compact = phone.trim().replace(/[\s.-]/g, "");
  const digits = compact.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "*".repeat(digits.length);
  }

  return `${"*".repeat(compact.length - 4)}${digits.slice(-4)}`;
}
