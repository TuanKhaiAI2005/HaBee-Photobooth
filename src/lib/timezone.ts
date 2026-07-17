const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

export function formatVietnamDateTime(value: Date | null | undefined): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: VIETNAM_TIME_ZONE,
  }).format(value);
}

export function vietnamDateToUtcRange(dateText: string, boundary: "start" | "endExclusive"): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return null;
  }

  const [year, month, day] = dateText.split("-").map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day) - VIETNAM_OFFSET_MS;

  if (boundary === "start") {
    return new Date(utcMidnight);
  }

  return new Date(utcMidnight + 24 * 60 * 60 * 1000);
}

export function todayVietnamUtcRange(now = new Date()): { startUtc: Date; endExclusiveUtc: Date } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const startUtc = vietnamDateToUtcRange(parts, "start");
  const endExclusiveUtc = vietnamDateToUtcRange(parts, "endExclusive");

  if (!startUtc || !endExclusiveUtc) {
    throw new Error("Không thể xác định ngày hiện tại.");
  }

  return { startUtc, endExclusiveUtc };
}

export function formatDurationMinutes(start: Date | null | undefined, end: Date | null | undefined): string {
  if (!start || !end || end <= start) {
    return "-";
  }

  const totalMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} phút`;
  }

  if (minutes === 0) {
    return `${hours} giờ`;
  }

  return `${hours} giờ ${minutes} phút`;
}
