import type { Prisma, Room, RoomStatus } from "@prisma/client";
import type { PublicAccount } from "@/lib/auth/account";
import { assertAdminAccount } from "@/lib/admin/authorization";
import type { CreateRoomInput, UpdateRoomInput } from "@/lib/admin/room-schemas";

export type RoomRepository = {
  create(args: { data: Prisma.RoomCreateInput }): Promise<Room>;
  update(args: { where: { id: string }; data: Prisma.RoomUpdateInput }): Promise<Room>;
  delete(args: { where: { id: string } }): Promise<Room>;
  findUnique(args: { where: { publicToken: string } }): Promise<Room | null>;
};

function slugifyRoomName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized || "room";
}

export async function generateUniqueRoomPublicToken(
  repository: Pick<RoomRepository, "findUnique">,
  name: string,
): Promise<string> {
  const base = slugifyRoomName(name);

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const publicToken = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const existing = await repository.findUnique({ where: { publicToken } });

    if (!existing) {
      return publicToken;
    }
  }

  throw new Error("Không thể tạo public token duy nhất cho phòng.");
}

export async function createRoomForAdmin(
  account: PublicAccount,
  repository: Pick<RoomRepository, "findUnique" | "create">,
  input: CreateRoomInput,
): Promise<Room> {
  assertAdminAccount(account);

  const publicToken = await generateUniqueRoomPublicToken(repository, input.name);

  return repository.create({
    data: {
      name: input.name,
      publicToken,
      color: input.color,
      defaultDurationMinutes: input.defaultDurationMinutes,
      sortOrder: input.sortOrder,
      status: input.status,
    },
  });
}

export async function updateRoomForAdmin(
  account: PublicAccount,
  repository: Pick<RoomRepository, "update">,
  input: UpdateRoomInput,
): Promise<Room> {
  assertAdminAccount(account);

  return repository.update({
    where: { id: input.id },
    data: {
      name: input.name,
      color: input.color,
      defaultDurationMinutes: input.defaultDurationMinutes,
      sortOrder: input.sortOrder,
      status: input.status as RoomStatus,
    },
  });
}

export async function pauseRoomForAdmin(
  account: PublicAccount,
  repository: Pick<RoomRepository, "update">,
  id: string,
): Promise<Room> {
  assertAdminAccount(account);

  return repository.update({
    where: { id },
    data: { status: "PAUSED" },
  });
}

export async function deleteRoomForAdmin(
  account: PublicAccount,
  repository: Pick<RoomRepository, "delete">,
  id: string,
): Promise<Room> {
  assertAdminAccount(account);

  return repository.delete({
    where: { id },
  });
}

