import { CHART_COLORS, CHART_SCALE, scale } from "./scale.js";
import { useChartWidth } from "./useChartWidth.js";

/**
 * Dependency-free SVG line chart.
 *  series: [{ name, color?, points: [{ x: string, y: number|null }] }]
 *  bands (optional): [{ from, to, color, label }] — shaded reference zones drawn
 *  behind the lines. The y-scale is widened to include band bounds, so a band
 *  stays visible even when the readings sit outside it — that gap is exactly
 *  the thing worth seeing.
 */
export default function LineChart({ series, width: fallbackWidth = 520, height = 180, emptyLabel = "No data in this range", bands = [] }) {
  const [ref, width] = useChartWidth(fallbackWidth); // fills its container; see useChartWidth
  const padding = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allPoints = series.flatMap((s) => s.points.filter((p) => p.y !== null && p.y !== undefined));
  if (!allPoints.length) {
    return (
      <div ref={ref}>
        <div className="chart-empty" style={{ height: height * CHART_SCALE }}>
          {emptyLabel}
        </div>
      </div>
    );
  }

  const values = allPoints.map((p) => p.y).concat(bands.flatMap((b) => [b.from, b.to]));
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.1;
  min -= pad;
  max += pad;

  const xCount = Math.max(...series.map((s) => s.points.length));
  const xFor = (i) => padding.left + scale(i, 0, Math.max(xCount - 1, 1), 0, innerW);
  const yFor = (v) => padding.top + scale(v, min, max, innerH, 0);
  const colorOf = (s, i) => s.color || CHART_COLORS[i % CHART_COLORS.length];
  const hasY = (p) => p.y !== null && p.y !== undefined;

  const xTicks = [0, Math.floor((xCount - 1) / 2), xCount - 1].filter(
    (v, i, arr) => arr.indexOf(v) === i && series[0]?.points[v]
  );

  return (
    <div ref={ref}>
      {(series.length > 1 || bands.length > 0) && (
        <div className="chart-legend">
          {series.map((s, i) => (
            <span key={s.name}>
              <i style={{ background: colorOf(s, i) }} />
              {s.name}
            </span>
          ))}
          {bands.map((b) => (
            <span key={b.label}>
              <i style={{ background: b.color || "#2F8F5B", opacity: 0.5 }} />
              {b.label}
            </span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block" }}>
        {bands.map((b) => {
          const y1 = yFor(Math.min(b.to, max));
          const y2 = yFor(Math.max(b.from, min));
          return (
            <rect
              key={b.label}
              x={padding.left}
              y={y1}
              width={innerW}
              height={Math.max(y2 - y1, 0)}
              fill={b.color || "#2F8F5B"}
              opacity="0.12"
            />
          );
        })}

        {[0, 0.5, 1].map((t) => {
          const y = padding.top + t * innerH;
          const val = max - t * (max - min);
          return (
            <g key={t}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--line)" strokeWidth="1" />
              <text x={padding.left - 8} y={y} fontSize="10" fill="var(--muted)" textAnchor="end" dominantBaseline="middle">
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {series.map((s, si) => {
          const color = colorOf(s, si);
          const pts = s.points
            .map((p, i) => (hasY(p) ? `${xFor(i)},${yFor(p.y)}` : null))
            .filter(Boolean)
            .join(" ");
          return (
            <g key={s.name}>
              <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.points.map((p, i) => (hasY(p) ? <circle key={i} cx={xFor(i)} cy={yFor(p.y)} r="2.5" fill={color} /> : null))}
            </g>
          );
        })}

        {xTicks.map((i) => (
          <text key={i} x={xFor(i)} y={height - 8} fontSize="10" fill="var(--muted)" textAnchor="middle">
            {series[0].points[i].x}
          </text>
        ))}
      </svg>
    </div>
  );
}
