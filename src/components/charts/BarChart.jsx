import { CHART_SCALE, scale } from "./scale.js";
import { useChartWidth } from "./useChartWidth.js";

/** Dependency-free SVG bar chart. labels/values are parallel arrays. */
export default function BarChart({ labels, values, color = "#1F7A6C", width: fallbackWidth = 520, height = 180, emptyLabel = "No data in this range" }) {
  const [ref, width] = useChartWidth(fallbackWidth); // fills its container; see useChartWidth
  const padding = { top: 16, right: 10, bottom: 28, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const valid = values.filter((v) => v !== null && v !== undefined);
  if (!valid.length) {
    return (
      <div ref={ref}>
        <div className="chart-empty" style={{ height: height * CHART_SCALE }}>
          {emptyLabel}
        </div>
      </div>
    );
  }

  const max = Math.max(...valid, 1);
  const barW = innerW / values.length;

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block" }}>
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={width - padding.right}
          y2={padding.top + innerH}
          stroke="var(--line)"
        />
        {values.map((v, i) => {
          if (v === null || v === undefined) return null;
          const barH = scale(v, 0, max, 0, innerH);
          return (
            <rect
              key={i}
              x={padding.left + i * barW + barW * 0.15}
              y={padding.top + (innerH - barH)}
              width={barW * 0.7}
              height={barH}
              rx="3"
              fill={color}
            />
          );
        })}
        {labels.map((l, i) => (
          <text key={i} x={padding.left + i * barW + barW / 2} y={height - 8} fontSize="10" fill="var(--muted)" textAnchor="middle">
            {l}
          </text>
        ))}
      </svg>
    </div>
  );
}
