type RoomReference = string | { name: string };

type RoomIconKind = "circle" | "heart" | "square";

type RoomIconProps = {
  room: RoomReference;
  className?: string;
};

type RoomLabelProps = RoomIconProps & {
  iconClassName?: string;
};

const roomIconByNumber: Record<string, RoomIconKind> = {
  "1": "circle",
  "2": "heart",
  "3": "square",
};

const roomSymbolByIcon: Record<RoomIconKind, string> = {
  circle: "●",
  heart: "♥",
  square: "■",
};

function roomName(room: RoomReference): string {
  return typeof room === "string" ? room : room.name;
}

function normalizeRoomName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function roomIconKind(room: RoomReference): RoomIconKind | null {
  const normalizedName = normalizeRoomName(roomName(room));
  const roomNumber = /^(?:phong|room)\s*([123])(?:\s|$)/.exec(normalizedName)?.[1];

  return roomNumber ? roomIconByNumber[roomNumber] ?? null : null;
}

export function roomLabelText(room: RoomReference): string {
  const name = roomName(room);
  const icon = roomIconKind(room);

  return icon ? `${roomSymbolByIcon[icon]} ${name}` : name;
}

export function RoomIcon({ room, className }: RoomIconProps) {
  const icon = roomIconKind(room);

  if (!icon) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className={["h-4 w-4 shrink-0", className].filter(Boolean).join(" ")}
      focusable="false"
      viewBox="0 0 16 16"
    >
      {icon === "circle" ? <circle cx="8" cy="8" fill="currentColor" r="5.5" /> : null}
      {icon === "heart" ? (
        <path d="M8 13.4 2.5 8.2A3.35 3.35 0 0 1 7.2 3.4L8 4.2l.8-.8a3.35 3.35 0 0 1 4.7 4.8L8 13.4Z" fill="currentColor" />
      ) : null}
      {icon === "square" ? <rect fill="currentColor" height="11" rx="0.75" width="11" x="2.5" y="2.5" /> : null}
    </svg>
  );
}

export function RoomLabel({ room, className, iconClassName }: RoomLabelProps) {
  return (
    <span className={["inline-flex min-w-0 items-center gap-2", className].filter(Boolean).join(" ")}>
      <RoomIcon className={iconClassName} room={room} />
      <span>{roomName(room)}</span>
    </span>
  );
}
