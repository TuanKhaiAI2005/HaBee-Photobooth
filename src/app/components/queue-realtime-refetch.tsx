import { QueueConnectionIndicator } from "@/app/components/connection-indicator";

type QueueRealtimeRefetchProps = {
  roomId: string;
  mode?: "admin" | "staff" | "customer" | "public";
};

export function QueueRealtimeRefetch({ roomId, mode = "admin" }: QueueRealtimeRefetchProps) {
  return <QueueConnectionIndicator mode={mode} roomId={roomId} />;
}
