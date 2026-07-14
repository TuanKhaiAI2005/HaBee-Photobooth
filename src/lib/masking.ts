export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "*".repeat(digits.length);
  }

  return `${digits.slice(0, 3)}${"*".repeat(digits.length - 5)}${digits.slice(-2)}`;
}
