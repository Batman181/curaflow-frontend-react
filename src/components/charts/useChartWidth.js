import { useLayoutEffect, useRef, useState } from "react";
import { CHART_SCALE } from "./scale.js";

const MIN_VIEWBOX_WIDTH = 240;

/**
 * Measures the element the chart sits in and returns [ref, viewBoxWidth], so the
 * chart fills the available width at a fixed scale (see CHART_SCALE). Until it has
 * been measured — or where ResizeObserver doesn't exist (e.g. in tests) — it
 * returns `fallback`.
 */
export function useChartWidth(fallback) {
  const ref = useRef(null);
  const [pixels, setPixels] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setPixels(w);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, pixels ? Math.max(pixels / CHART_SCALE, MIN_VIEWBOX_WIDTH) : fallback];
}
