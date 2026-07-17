-- Sprint 4 queue operation invariants.
CREATE UNIQUE INDEX "QueueTicket_room_called_key"
  ON "QueueTicket"("roomId")
  WHERE "status" = 'CALLED';

CREATE UNIQUE INDEX "QueueTicket_room_in_service_key"
  ON "QueueTicket"("roomId")
  WHERE "status" = 'IN_SERVICE';
