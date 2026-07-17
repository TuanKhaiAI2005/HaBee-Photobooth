type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="brand-mark" aria-label="HaBee Photobooth">
      <span className="brand-bubble">HaBee</span>
      {!compact ? <span className="brand-script">Photobooth</span> : null}
    </div>
  );
}
