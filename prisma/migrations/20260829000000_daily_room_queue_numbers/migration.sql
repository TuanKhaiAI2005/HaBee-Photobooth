-- Daily, per-room immutable customer queue numbers.
ALTER TABLE "QueueTicket"
  ADD COLUMN "queueNumber" INTEGER,
  ADD COLUMN "businessDate" DATE;

ALTER TABLE "QueueTicket"
  ADD CONSTRAINT "QueueTicket_daily_queue_number_pair_check"
  CHECK (
    ("queueNumber" IS NULL AND "businessDate" IS NULL)
    OR (
      "queueNumber" IS NOT NULL
      AND "businessDate" IS NOT NULL
      AND "queueNumber" BETWEEN 1 AND 50
    )
  );

CREATE INDEX "QueueTicket_businessDate_idx"
  ON "QueueTicket"("businessDate");

CREATE INDEX "QueueTicket_roomId_businessDate_idx"
  ON "QueueTicket"("roomId", "businessDate");

CREATE UNIQUE INDEX "QueueTicket_roomId_businessDate_queueNumber_key"
  ON "QueueTicket"("roomId", "businessDate", "queueNumber");

CREATE TABLE "QueueNumberCounter" (
  "roomId" UUID NOT NULL,
  "businessDate" DATE NOT NULL,
  "lastNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "QueueNumberCounter_pkey"
    PRIMARY KEY ("roomId", "businessDate"),
  CONSTRAINT "QueueNumberCounter_lastNumber_check"
    CHECK ("lastNumber" BETWEEN 1 AND 50)
);

CREATE INDEX "QueueNumberCounter_businessDate_idx"
  ON "QueueNumberCounter"("businessDate");

ALTER TABLE "QueueNumberCounter"
  ADD CONSTRAINT "QueueNumberCounter_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Counter state is server-only, like every other business table.
ALTER TABLE public."QueueNumberCounter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QueueNumberCounter" NO FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."QueueNumberCounter"
FROM PUBLIC, anon, authenticated;
