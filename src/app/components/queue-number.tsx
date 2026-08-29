type QueueNumberProps = {
  queueNumber: number | null | undefined;
  className?: string;
};

export function QueueNumber({ queueNumber, className }: QueueNumberProps) {
  return (
    <span
      className={[
        "inline-flex whitespace-nowrap rounded-full border-2 border-[var(--color-navy)] bg-[var(--color-accent)] px-3 py-1 text-sm font-black text-[var(--color-navy)] shadow-[2px_2px_0_var(--color-navy)]",
        className,
      ].filter(Boolean).join(" ")}
    >
      STT {queueNumber ?? "—"}
    </span>
  );
}
