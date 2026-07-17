import { randomBytes } from "crypto";

export function generateTicketCode(date = new Date(), random = randomBytes): string {
  const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = random(3).toString("hex").toUpperCase();

  return `Q-${yymmdd}-${suffix}`;
}
