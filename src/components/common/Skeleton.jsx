export default function Skeleton({ height, width, style }) {
  return <div className="skeleton-line" style={{ height, width, ...style }} />;
}
