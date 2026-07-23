import type { RoomStatus } from "@prisma/client";

export function isPublicRoomStatus(status: RoomStatus): boolean {
  return status === "ACTIVE";
}

export function canRegisterRoomStatus(status: RoomStatus): boolean {
  return status === "ACTIVE";
}
