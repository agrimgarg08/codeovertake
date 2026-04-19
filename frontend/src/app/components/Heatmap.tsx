import { useMemo } from "react";

interface HeatmapProps {
  data: Record<string, number>; // { "2025-01-15": 3, ... }
  color?: string;
  label?: string;
  compact?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getLevel(count: number, thresholds: number[]): number {
  if (count === 0) return 0;
  if (count > thresholds[2]) return 4;
  if (count > thresholds[1]) return 3;
  if (count > thresholds[0]) return 2;
  return 1;
}

export function Heatmap({ data, color = "#4ade80", label, compact = false }: HeatmapProps) {
  const { weeks, monthLabels, thresholds, totalDays, totalContributions } = useMemo(() => {
    const today = new Date();
    const weeksCount = compact ? 26 : 52;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeksCount * 7 - 1) - startDate.getDay());

    const weeks: { date: string; count: number; day: number }[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    let currentWeek: { date: string; count: number; day: number }[] = [];
    let lastMonth = -1;
    let totalDays = 0;
    let totalContributions = 0;

    const d = new Date(startDate);
    let col = 0;

    while (d <= today) {
      const key = d.toISOString().split("T")[0];
      const count = data[key] || 0;
      const dayOfWeek = d.getDay();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
        col++;
      }

      const month = d.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTHS[month], col });
        lastMonth = month;
      }

      currentWeek.push({ date: key, count, day: dayOfWeek });
      if (count > 0) totalDays++;
      totalContributions += count;

      d.setDate(d.getDate() + 1);
    }

    if (currentWeek.length > 0) weeks.push(currentWeek);
    
    // Collect all non-zero counts from the visible date range only
    const visibleCounts: number[] = [];
    for (const week of weeks) {
      for (const day of week) {
        if (day.count > 0) visibleCounts.push(day.count);
      }
    }
    visibleCounts.sort((a, b) => a - b);

    const thresholds = [
      visibleCounts[Math.max(0, Math.floor(visibleCounts.length * 0.25) - 1)] || 0,
      visibleCounts[Math.max(0, Math.floor(visibleCounts.length * 0.50) - 1)] || 0,
      visibleCounts[Math.max(0, Math.floor(visibleCounts.length * 0.75) - 1)] || 0,
    ];

    return { weeks, monthLabels, thresholds, totalDays, totalContributions };
  }, [data, compact]);


  const levelColors = [
    "#161616", // level 0 — no activity
    `${color}33`, // level 1 — 20% opacity
    `${color}66`, // level 2 — 40%
    `${color}aa`, // level 3 — 67%
    color,        // level 4 — full
  ];

  const cellSize = compact ? 10 : 12;
  const gap = 2;
  const leftPad = compact ? 0 : 28;
  const topPad = compact ? 0 : 16;
  const svgW = leftPad + weeks.length * (cellSize + gap);
  const svgH = topPad + 7 * (cellSize + gap);

  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <span className="font-['JetBrains_Mono'] text-xs text-[#888888]">{label}</span>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#666666]">
            {totalContributions} contributions · {totalDays} active days
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <svg width={svgW} height={svgH} className="block">
          {/* Month labels */}
          {!compact &&
            monthLabels.map((m, i) => (
              <text
                key={`m-${i}`}
                x={leftPad + m.col * (cellSize + gap)}
                y={10}
                className="fill-[#666666] font-['JetBrains_Mono']"
                fontSize={9}
              >
                {m.label}
              </text>
            ))}

          {/* Day labels */}
          {!compact &&
            DAYS.map((d, i) => (
              d ? (
                <text
                  key={`d-${i}`}
                  x={0}
                  y={topPad + i * (cellSize + gap) + cellSize - 2}
                  className="fill-[#666666] font-['JetBrains_Mono']"
                  fontSize={9}
                >
                  {d}
                </text>
              ) : null
            ))}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((day) => (
              <rect
                key={day.date}
                x={leftPad + wi * (cellSize + gap)}
                y={topPad + day.day * (cellSize + gap)}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={levelColors[getLevel(day.count, thresholds)]}
              >
                <title>{`${day.date}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`}</title>
              </rect>
            ))
          )}
        </svg>
      </div>
    </div>
  );
}

// Combined heatmap — merges all platforms into one grid
export function CombinedHeatmap({
  platformData,
  compact = false,
}: {
  platformData: Record<string, Record<string, number>>;
  compact?: boolean;
}) {
  const merged = useMemo(() => {
    const combined: Record<string, number> = {};
    for (const platform of Object.values(platformData)) {
      for (const [date, count] of Object.entries(platform)) {
        combined[date] = (combined[date] || 0) + count;
      }
    }
    return combined;
  }, [platformData]);

  if (Object.keys(merged).length === 0) return null;

  return <Heatmap data={merged} label="Activity (All Platforms)" compact={compact} />;
}
