interface LoadingBlockProps {
  label?: string;
}

export function LoadingBlock({ label = "جاري التحميل..." }: LoadingBlockProps) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <div className="loading-block-shimmer" />
      <div className="loading-block-shimmer short" />
      <div className="loading-block-shimmer medium" />
      <span className="loading-block-label">{label}</span>
    </div>
  );
}
