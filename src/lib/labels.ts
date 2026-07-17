import type { QueueTicketStatus, RoomStatus } from "@prisma/client";

export function ticketStatusLabel(status: QueueTicketStatus | string): string {
  const labels: Record<string, string> = {
    WAITING: "Đang chờ",
    CALLED: "Đã gọi",
    IN_SERVICE: "Đang sử dụng",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_SHOW: "Không đến",
  };

  return labels[status] ?? status;
}

export function roomStatusLabel(status: RoomStatus | string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Đang hoạt động",
    PAUSED: "Tạm dừng",
    MAINTENANCE: "Bảo trì",
    INACTIVE: "Ngừng dùng",
  };

  return labels[status] ?? status;
}
