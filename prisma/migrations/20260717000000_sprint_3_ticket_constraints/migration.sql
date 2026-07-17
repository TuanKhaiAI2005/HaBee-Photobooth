-- Add Sprint 3 safety constraints for ticket lookup and queue creation.
CREATE UNIQUE INDEX "QueueTicket_customerAccessTokenHash_key"
  ON "QueueTicket"("customerAccessTokenHash");

CREATE UNIQUE INDEX "QueueTicket_roomId_queuePosition_key"
  ON "QueueTicket"("roomId", "queuePosition");

CREATE UNIQUE INDEX "QueueTicket_normalizedPhone_active_key"
  ON "QueueTicket"("normalizedPhone")
  WHERE "status" IN ('WAITING', 'CALLED', 'IN_SERVICE');
