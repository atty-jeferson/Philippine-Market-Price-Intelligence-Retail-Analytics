import React, { useState } from 'react';

export interface BoxPlotGroup {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
  count: number;
  color?: string;
  secondaryLabel?: string;
}

interface PriceBoxPlotProps {
  groups: BoxPlotGroup[];
  benchmarkMedian?: number;
  benchmarkLabel?: string;
  unit?: string;
  height?: number;
  onSelectGroup?: (label: string) => void;
  selectedGroup?: string | null;
}

export const PriceBoxPlot: React.FC<PriceBoxPlotProps> = ({
  groups,
  benchmarkMedian,
  benchmarkLabel = 'Market Median',
  unit = '₱/100g',
  height = 320,
  onSelectGroup,
  selectedGroup
}) => {
  const [hoveredGroup, setHoveredGroup] = useState<BoxPlotGroup | null>(null);

  if (!groups || groups.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-gray-400">
        No distribution data available
      </div>
    );
  }

  // Calculate global min and max for scaling
  let globalMin = Math.min(...groups.map((g) => g.min));
  let globalMax = Math.max(...groups.map((g) => g.max));

  if (benchmarkMedian !== undefined) {
    globalMin = Math.min(globalMin, benchmarkMedian);
    globalMax = Math.max(globalMax, benchmarkMedian);
  }

  // Add 10% padding on min and max
  const paddingSpan = (globalMax - globalMin) * 0.1 || 10;
  const scaleMin = Math.max(0, Math.floor(globalMin - paddingSpan));
  const scaleMax = Math.ceil(globalMax + paddingSpan);
  const scaleSpan = scaleMax - scaleMin || 1;

  // Chart dimensions
  const svgHeight = height;
  const paddingTop = 30;
  const paddingBottom = 60;
  const paddingLeft = 65;
  const paddingRight = 30;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Scale function: value -> Y coordinate (inverted: higher value is near top)
  const getY = (val: number) => {
    const ratio = (val - scaleMin) / scaleSpan;
    return paddingTop + plotHeight * (1 - ratio);
  };

  // Generate 5 nice Y-axis ticks
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    return Math.round(scaleMin + (scaleSpan / (tickCount - 1)) * i);
  });

  const columnWidth = Math.max(50, 480 / Math.max(groups.length, 1));
  const totalSvgWidth = paddingLeft + paddingRight + groups.length * columnWidth;

  return (
    <div className="w-full overflow-x-auto select-none">
      <div className="min-w-[540px] relative">
        <svg
          viewBox={`0 0 ${totalSvgWidth} ${svgHeight}`}
          className="w-full h-auto"
          style={{ maxHeight: height }}
        >
          {/* Y-axis gridlines and labels */}
          {ticks.map((t, idx) => {
            const y = getY(t);
            return (
              <g key={`tick-${idx}`} className="text-gray-400">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={totalSvgWidth - paddingRight}
                  y2={y}
                  stroke="#EEF0EA"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] font-data fill-[#737A74]"
                >
                  ₱{t}
                </text>
              </g>
            );
          })}

          {/* Benchmark Reference Line */}
          {benchmarkMedian !== undefined && (
            <g>
              <line
                x1={paddingLeft}
                y1={getY(benchmarkMedian)}
                x2={totalSvgWidth - paddingRight}
                y2={getY(benchmarkMedian)}
                stroke="#737A74"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={totalSvgWidth - paddingRight}
                y={getY(benchmarkMedian) - 6}
                textAnchor="end"
                className="text-[10px] font-data fill-[#163829] font-semibold"
              >
                {benchmarkLabel}: ₱{benchmarkMedian.toFixed(2)}
              </text>
            </g>
          )}

          {/* Box-and-whisker groups */}
          {groups.map((group, idx) => {
            const centerX = paddingLeft + idx * columnWidth + columnWidth / 2;
            const boxWidth = Math.min(36, columnWidth * 0.55);

            const yMin = getY(group.min);
            const yQ1 = getY(group.q1);
            const yMedian = getY(group.median);
            const yQ3 = getY(group.q3);
            const yMax = getY(group.max);

            const isSelected = selectedGroup === group.label;
            const isHovered = hoveredGroup?.label === group.label;
            const groupColor = group.color || '#176B4D';

            return (
              <g
                key={`group-${idx}`}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredGroup(group)}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => onSelectGroup && onSelectGroup(group.label)}
                opacity={selectedGroup && !isSelected ? 0.45 : 1}
              >
                {/* Background hover highlight column */}
                <rect
                  x={centerX - columnWidth / 2 + 2}
                  y={paddingTop}
                  width={columnWidth - 4}
                  height={plotHeight}
                  fill={isHovered ? '#EEF4EE' : 'transparent'}
                  rx="4"
                />

                {/* Vertical Whisker Line from Min to Max */}
                <line
                  x1={centerX}
                  y1={yMax}
                  x2={centerX}
                  y2={yMin}
                  stroke={groupColor}
                  strokeWidth="1.5"
                />

                {/* Top Whisker Cap (Max) */}
                <line
                  x1={centerX - boxWidth / 3}
                  y1={yMax}
                  x2={centerX + boxWidth / 3}
                  y2={yMax}
                  stroke={groupColor}
                  strokeWidth="1.5"
                />

                {/* Bottom Whisker Cap (Min) */}
                <line
                  x1={centerX - boxWidth / 3}
                  y1={yMin}
                  x2={centerX + boxWidth / 3}
                  y2={yMin}
                  stroke={groupColor}
                  strokeWidth="1.5"
                />

                {/* IQR Box (Q1 to Q3) */}
                <rect
                  x={centerX - boxWidth / 2}
                  y={yQ3}
                  width={boxWidth}
                  height={Math.max(2, yQ1 - yQ3)}
                  fill={isSelected || isHovered ? groupColor : '#FFFFFF'}
                  stroke={groupColor}
                  strokeWidth="2"
                  rx="2"
                  className="transition-colors"
                />

                {/* Median Horizontal Line */}
                <line
                  x1={centerX - boxWidth / 2}
                  y1={yMedian}
                  x2={centerX + boxWidth / 2}
                  y2={yMedian}
                  stroke={isSelected || isHovered ? '#FFFFFF' : '#163829'}
                  strokeWidth="2.5"
                />

                {/* Outliers dots if any */}
                {group.outliers?.map((outlier, oIdx) => (
                  <circle
                    key={`outlier-${oIdx}`}
                    cx={centerX}
                    cy={getY(outlier)}
                    r="2.5"
                    fill="none"
                    stroke="#C04D44"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Group Label below axis */}
                <text
                  x={centerX}
                  y={svgHeight - paddingBottom + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-medium font-sans ${
                    isSelected ? 'fill-[#176B4D] font-bold' : 'fill-[#163829]'
                  }`}
                >
                  {group.label}
                </text>

                <text
                  x={centerX}
                  y={svgHeight - paddingBottom + 32}
                  textAnchor="middle"
                  className="text-[9px] font-data fill-[#737A74]"
                >
                  n={group.count}
                </text>

                {/* Median label above box if hovered */}
                {isHovered && (
                  <text
                    x={centerX}
                    y={yQ3 - 6}
                    textAnchor="middle"
                    className="text-[10px] font-data font-bold fill-[#163829]"
                  >
                    ₱{group.median.toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover summary card */}
        {hoveredGroup && (
          <div className="absolute top-2 right-4 bg-white/98 backdrop-blur-xs border border-[#E3E6DF] rounded-xl p-3 shadow-card text-xs pointer-events-none z-10 space-y-1 font-sans">
            <div className="font-bold text-[#163829] flex items-center justify-between gap-3">
              <span>{hoveredGroup.label}</span>
              <span className="font-data text-[#737A74] font-normal">n = {hoveredGroup.count}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-data text-[#4F5751]">
              <div>Max: <span className="font-semibold text-[#163829]">₱{hoveredGroup.max.toFixed(2)}</span></div>
              <div>Q3: <span className="font-semibold text-[#163829]">₱{hoveredGroup.q3.toFixed(2)}</span></div>
              <div>Median: <span className="font-bold text-[#176B4D]">₱{hoveredGroup.median.toFixed(2)}</span></div>
              <div>Q1: <span className="font-semibold text-[#163829]">₱{hoveredGroup.q1.toFixed(2)}</span></div>
              <div>Min: <span className="font-semibold text-[#163829]">₱{hoveredGroup.min.toFixed(2)}</span></div>
              <div>IQR: <span className="font-semibold text-[#163829]">₱{(hoveredGroup.q3 - hoveredGroup.q1).toFixed(2)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
