type BrandMarkProps = {
  compact?: boolean;
};

type HaBeeLogoTextProps = {
  className?: string;
};

export function HaBeeLogoText({ className }: HaBeeLogoTextProps) {
  return <span className={className ? `habee-logo-text ${className}` : "habee-logo-text"}>HaBee</span>;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className={compact ? "brand-mark brand-mark-compact" : "brand-mark"} aria-label="HaBee Photobooth">
      <span className="brand-bubble">HaBee</span>
      {!compact ? <span className="brand-script">Photobooth</span> : null}
      {!compact ? (
        <span className="brand-tagline">Chụp ảnh Hàn Quốc - Chụp ảnh lấy ngay</span>
      ) : null}
    </div>
  );
}
