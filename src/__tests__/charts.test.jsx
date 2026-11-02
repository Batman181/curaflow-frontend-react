import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BarChart from "../components/charts/BarChart.jsx";
import LineChart from "../components/charts/LineChart.jsx";
import { CHART_SCALE } from "../components/charts/scale.js";

const pts = (ys) => ys.map((y, i) => ({ x: `d${i}`, y }));

describe("LineChart", () => {
  it("draws a polyline and a dot per point, skipping nulls", () => {
    const { container } = render(<LineChart series={[{ name: "HR", points: pts([70, null, 80]) }]} />);
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });
  it("shows the empty label when there is no data", () => {
    render(<LineChart series={[{ name: "HR", points: pts([null, null]) }]} emptyLabel="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
  it("draws reference bands and lists them in the legend", () => {
    const { container } = render(
      <LineChart series={[{ name: "HR", points: pts([70, 80]) }]} bands={[{ from: 60, to: 100, label: "Typical resting range" }]} />
    );
    expect(container.querySelectorAll("rect")).toHaveLength(1);
    expect(screen.getByText("Typical resting range")).toBeInTheDocument();
  });
  it("widens the scale so a band is visible even when readings are far outside it", () => {
    const { container } = render(
      <LineChart series={[{ name: "HR", points: pts([150, 160]) }]} bands={[{ from: 60, to: 100, label: "b" }]} />
    );
    expect(Number(container.querySelector("rect").getAttribute("height"))).toBeGreaterThan(0);
  });
});

describe("BarChart", () => {
  it("draws one bar per non-null value", () => {
    const { container } = render(<BarChart labels={["a", "b", "c"]} values={[1, null, 3]} />);
    expect(container.querySelectorAll("rect")).toHaveLength(2);
  });
  it("shows the empty label with no values", () => {
    render(<BarChart labels={[]} values={[]} />);
    expect(screen.getByText("No data in this range")).toBeInTheDocument();
  });
});

describe("charts fill their container at a constant scale", () => {
  // Without these, a full-width chart would grow in proportion to its width — over 2x taller,
  // with 2x larger labels — once the page content stopped being capped at 960px.
  const withContainerWidth = (px) => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: px, height: 0, top: 0, left: 0, right: px, bottom: 0, x: 0, y: 0, toJSON() {} });
  };
  const viewBox = (container) => container.querySelector("svg").getAttribute("viewBox");

  it("draws the line chart as wide as its container, at CHART_SCALE pixels per unit", () => {
    withContainerWidth(1200);
    const { container } = render(<LineChart series={[{ name: "HR", points: pts([70, 80]) }]} />);
    expect(viewBox(container)).toBe(`0 0 ${1200 / CHART_SCALE} 180`); // height stays 180 units (216px) however wide it gets
  });

  it("does the same for the bar chart", () => {
    withContainerWidth(900);
    const { container } = render(<BarChart labels={["a", "b"]} values={[1, 2]} />);
    expect(viewBox(container)).toBe(`0 0 ${900 / CHART_SCALE} 180`);
  });

  it("never draws narrower than a readable minimum", () => {
    withContainerWidth(120);
    const { container } = render(<LineChart series={[{ name: "HR", points: pts([70, 80]) }]} />);
    expect(viewBox(container)).toBe("0 0 240 180");
  });

  it("falls back to the default width when the container can't be measured", () => {
    const { container } = render(<LineChart series={[{ name: "HR", points: pts([70, 80]) }]} />);
    expect(viewBox(container)).toBe("0 0 520 180");
  });
});
