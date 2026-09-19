import React, { useState } from 'react';

export interface SlopeItem {
  id: string;
  label: string;
  brand?: string;
  beforeVal: number;
  afterVal: number;
  secondaryText?: string;
  color?: string;
}

interface SlopeChartProps {
  items: SlopeItem[];
  beforeLabel?: string;
  afterLabel?: string;
  unitPrefix?: string;
  height?: number;
  onSelectItem?: (item: SlopeItem) => void;
  selectedId?: string | null;
}

export const SlopeChart: React.FC<SlopeChartProps> = ({
  items,
  beforeLabel = 'Regular Shelf Price',
  afterLabel = 'Promo Price',
  unitPrefix = '₱',
  height = 300,
  onSelectItem,
  selectedId
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-gray-400">
        No paired observations available for slope comparison
      </div>
    );
  }

  // Determine global min and max across before and after
  const allValues = items.flatMap((i) => [i.beforeVal, i.afterVal]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const paddingSpan = (maxVal - minVal) * 0.1 || 10;
  const scaleMin = Math.max(0, minVal - paddingSpan);
  const scaleMax = maxVal + paddingSpan;
  const scaleSpan = scaleMax - scaleMin || 1;

  const svgHeight = height;
  const paddingTop = 36;
  const paddingBottom = 40;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const getY = (val: number) => {
    const ratio = (val - scaleMin) / scaleSpan;
    return paddingTop + plotHeight * (1 - ratio);
  };

  const xLeft = 140;
  const xRight = 440;
  const totalSvgWidth = 580;

  return (
    <div className="w-full overflow-x-auto select-none">
      <div className="min-w-[500px] relative">
        <svg
          viewBox={`0 0 ${totalSvgWidth} ${svgHeight}`}
          className="w-full h-auto"
          style={{ maxHeight: height }}
        >
          {/* Axis Columns */}
          <line
            x1={xLeft}
            y1={paddingTop}
            x2={xLeft}
            y2={svgHeight - paddingBottom}
            stroke="#E3E6DF"
            strokeWidth="1.5"
          />
          <line
            x1={xRight}
            y1={paddingTop}
            x2={xRight}
            y2={svgHeight - paddingBottom}
            stroke="#E3E6DF"
            strokeWidth="1.5"
          />

          {/* Column Headers */}
          <text
            x={xLeft}
            y={paddingTop - 14}
            textAnchor="middle"
            className="text-xs font-bold font-sans fill-[#163829]"
          >
            {beforeLabel}
          </text>
          <text
            x={xRight}
            y={paddingTop - 14}
            textAnchor="middle"
            className="text-xs font-bold font-sans fill-[#163829]"
          >
            {afterLabel}
          </text>

          {/* Slopes */}
          {items.map((item) => {
            const y1 = getY(item.beforeVal);
            const y2 = getY(item.afterVal);
            const isHovered = hoveredId === item.id;
            const isSelected = selectedId === item.id;
            const strokeColor =
              item.color ||
              (item.afterVal < item.beforeVal
                ? '#176B4D' // price decrease / promo
                : item.afterVal > item.beforeVal
                ? '#C04D44' // price increase
                : '#737A74');

            const opacity = hoveredId
              ? isHovered
                ? 1
                : 0.2
              : selectedId
              ? isSelected
                ? 1
                : 0.3
              : 0.85;

            const delta = item.afterVal - item.beforeVal;
            const deltaPct = item.beforeVal > 0 ? (delta / item.beforeVal) * 100 : 0;

            return (
              <g
                key={item.id}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectItem && onSelectItem(item)}
                opacity={opacity}
              >
                {/* Connecting Line */}
                <line
                  x1={xLeft}
                  y1={y1}
                  x2={xRight}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={isHovered || isSelected ? 3 : 1.75}
                />

                {/* Left Dot */}
                <circle
                  cx={xLeft}
                  cy={y1}
                  r={isHovered ? 4.5 : 3}
                  fill="#FFFFFF"
                  stroke={strokeColor}
                  strokeWidth="2"
                />

                {/* Left Label */}
                <text
                  x={xLeft - 8}
                  y={y1 + 4}
                  textAnchor="end"
                  className="text-[10px] font-data fill-[#4F5751]"
                >
                  {unitPrefix}
                  {item.beforeVal.toFixed(1)}
                  {isHovered && ` (${item.label})`}
                </text>

                {/* Right Dot */}
                <circle
                  cx={xRight}
                  cy={y2}
                  r={isHovered ? 4.5 : 3}
                  fill={strokeColor}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                {/* Right Label */}
                <text
                  x={xRight + 8}
                  y={y2 + 4}
                  textAnchor="start"
                  className="text-[10px] font-data fill-[#4F5751]"
                >
                  {unitPrefix}
                  {item.afterVal.toFixed(1)}
                  {isHovered && (
                    <tspan
                      fill={delta < 0 ? '#176B4D' : '#C04D44'}
                      fontWeight="bold"
                    >
                      {' '}
                      ({deltaPct.toFixed(1)}%)
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredId && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/98 backdrop-blur-xs border border-[#E3E6DF] px-3.5 py-1.5 rounded-lg shadow-card text-xs pointer-events-none font-data text-[#163829]">
            {items.find((i) => i.id === hoveredId)?.label}: {items.find((i) => i.id === hoveredId)?.beforeVal.toFixed(2)} → {items.find((i) => i.id === hoveredId)?.afterVal.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};
