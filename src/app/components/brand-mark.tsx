type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className={compact ? "brand-mark brand-mark-compact" : "brand-mark"} aria-label="HaBee Photobooth">
      <span className="brand-bubble">HABEE</span>
      {!compact ? <span className="brand-script">Photobooth</span> : null}
      {!compact ? (
        <span className="brand-tagline">Chụp ảnh Hàn Quốc - Chụp ảnh lấy ngay</span>
      ) : null}
    </div>
  );
}
