export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function getRemainingMilliseconds(expectedEndAt: Date | string | null, now = new Date()): number {
  if (!expectedEndAt) {
    return 0;
  }

  return Math.max(0, new Date(expectedEndAt).getTime() - now.getTime());
}

export function formatRemainingTime(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "Đã hết thời gian";
  }

  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

