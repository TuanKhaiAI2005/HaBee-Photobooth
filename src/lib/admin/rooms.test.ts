import type { Room } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/auth/roles";
import type { PublicAccount } from "@/lib/auth/account";
import { createRoomForAdmin, deleteRoomForAdmin, generateUniqueRoomPublicToken } from "@/lib/admin/rooms";

const admin: PublicAccount = {
  id: "admin",
  fullName: "Admin",
  role: "ADMIN",
  isActive: true,
};

const staff: PublicAccount = {
  id: "staff",
  fullName: "Staff",
  role: "STAFF",
  isActive: true,
};

const room: Room = {
  id: "d17bb468-a3c5-4a49-a715-3cfec0a2e0ce",
  name: "Phong 1",
  publicToken: "phong-1",
  color: "#111827",
  defaultDurationMinutes: 30,
  status: "ACTIVE",
  sortOrder: 0,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("room admin mutations", () => {
  it("allows only admin to create rooms", async () => {
    const repository = {
      async findUnique() {
        return null;
      },
      async create() {
        return room;
      },
      async update() {
        return room;
      },
    };

    await expect(
      createRoomForAdmin(admin, repository, {
        name: "Phong 1",
        color: "#111827",
        defaultDurationMinutes: 30,
        sortOrder: 0,
        status: "ACTIVE",
      }),
    ).resolves.toEqual(room);

    await expect(
      createRoomForAdmin(staff, repository, {
        name: "Phong 1",
        color: "#111827",
        defaultDurationMinutes: 30,
        sortOrder: 0,
        status: "ACTIVE",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("does not create two rooms with the same public token", async () => {
    const existing = new Set(["phong-1"]);
    const repository = {
      async findUnique({ where }: { where: { publicToken: string } }) {
        return existing.has(where.publicToken) ? room : null;
      },
    };

    await expect(generateUniqueRoomPublicToken(repository, "Phong 1")).resolves.toBe("phong-1-2");
  });

  it("allows only admin to delete rooms", async () => {
    const repository = {
      async delete() {
        return room;
      },
    };

    await expect(deleteRoomForAdmin(admin, repository, room.id)).resolves.toEqual(room);
    await expect(deleteRoomForAdmin(staff, repository, room.id)).rejects.toThrow(ForbiddenError);
  });
});
