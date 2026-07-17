CREATE TYPE "AccountRole" AS ENUM ('ADMIN', 'STAFF');
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'PAUSED', 'MAINTENANCE', 'INACTIVE');
CREATE TYPE "QueueTicketStatus" AS ENUM ('WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

CREATE TABLE "Account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT,
    "employeeUid" TEXT,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "account_identifier_by_role" CHECK (
        ("role" = 'ADMIN' AND "username" IS NOT NULL AND "employeeUid" IS NULL)
        OR ("role" = 'STAFF' AND "username" IS NULL AND "employeeUid" IS NOT NULL)
    )
);

CREATE TABLE "Room" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "defaultDurationMinutes" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QueueTicket" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticketCode" TEXT NOT NULL,
    "roomId" UUID NOT NULL,
    "customerName" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "customerAccessTokenHash" TEXT NOT NULL,
    "status" "QueueTicketStatus" NOT NULL DEFAULT 'WAITING',
    "queuePosition" INTEGER NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "serviceStartedAt" TIMESTAMP(3),
    "expectedEndAt" TIMESTAMP(3),
    "checkoutAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QueueEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roomId" UUID NOT NULL,
    "ticketId" UUID,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");
CREATE UNIQUE INDEX "Account_employeeUid_key" ON "Account"("employeeUid");
CREATE INDEX "Account_role_idx" ON "Account"("role");
CREATE INDEX "Account_isActive_idx" ON "Account"("isActive");
CREATE INDEX "Account_createdAt_idx" ON "Account"("createdAt");
CREATE UNIQUE INDEX "Room_publicToken_key" ON "Room"("publicToken");
CREATE INDEX "Room_status_idx" ON "Room"("status");
CREATE INDEX "Room_sortOrder_idx" ON "Room"("sortOrder");
CREATE INDEX "Room_createdAt_idx" ON "Room"("createdAt");
CREATE UNIQUE INDEX "QueueTicket_ticketCode_key" ON "QueueTicket"("ticketCode");
CREATE INDEX "QueueTicket_roomId_idx" ON "QueueTicket"("roomId");
CREATE INDEX "QueueTicket_status_idx" ON "QueueTicket"("status");
CREATE INDEX "QueueTicket_queuePosition_idx" ON "QueueTicket"("queuePosition");
CREATE INDEX "QueueTicket_normalizedPhone_idx" ON "QueueTicket"("normalizedPhone");
CREATE INDEX "QueueTicket_createdAt_idx" ON "QueueTicket"("createdAt");
CREATE INDEX "QueueTicket_roomId_status_queuePosition_idx" ON "QueueTicket"("roomId", "status", "queuePosition");
CREATE INDEX "QueueEvent_roomId_idx" ON "QueueEvent"("roomId");
CREATE INDEX "QueueEvent_ticketId_idx" ON "QueueEvent"("ticketId");
CREATE INDEX "QueueEvent_eventType_idx" ON "QueueEvent"("eventType");
CREATE INDEX "QueueEvent_createdAt_idx" ON "QueueEvent"("createdAt");

ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "QueueTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
