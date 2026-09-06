type StaffRoomQueueNumberProps = {
  queueNumber: number | null | undefined;
};

export function StaffRoomQueueNumber({ queueNumber }: StaffRoomQueueNumberProps) {
  return (
    <span className="shrink-0 whitespace-nowrap text-lg font-black">
      STT: {queueNumber ?? "--"}
    </span>
  );
}
