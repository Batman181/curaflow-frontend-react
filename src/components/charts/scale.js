export const CHART_COLORS = ["#1F7A6C", "#C1652B", "#B8801E", "#2F8F5B"];

export function scale(value, min, max, outMin, outMax) {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

// Charts are drawn in "viewBox units". CHART_SCALE is how many screen pixels one
// unit becomes, so tick labels stay a constant ~12px and a chart stays ~216px
// tall whatever its width — instead of growing in proportion to the width.
export const CHART_SCALE = 1.2;
