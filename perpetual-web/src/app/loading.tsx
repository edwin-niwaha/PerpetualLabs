export default function Loading() {
  return (
    <div className="shell loading-wrap" role="status" aria-label="Loading page">
      <div className="skeleton" style={{ width: 150 }} />
      <div className="skeleton skeleton-title" />
      <div className="skeleton" style={{ width: "45%" }} />
      <div className="skeleton skeleton-card" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
