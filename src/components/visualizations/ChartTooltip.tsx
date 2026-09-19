import React from 'react';

export interface ChartTooltipItem {
  label: string;
  value: string | number;
  color?: string;
  delta?: {
    value: string;
    isPositiveGood?: boolean;
    isNegative?: boolean;
  };
}

interface ChartTooltipProps {
  title: string;
  subtitle?: string;
  items: ChartTooltipItem[];
  footer?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  title,
  subtitle,
  items,
  footer
}) => {
  return (
    <div className="bg-white/98 backdrop-blur-md text-[#163829] p-3.5 rounded-xl border border-[#E3E6DF] shadow-card text-xs space-y-2.5 min-w-[210px] font-sans">
      <div className="border-b border-[#EEF0EA] pb-2">
        <div className="font-bold text-[#163829] text-xs leading-snug tracking-tight">{title}</div>
        {subtitle && <div className="text-[10px] text-[#737A74] font-sans mt-0.5">{subtitle}</div>}
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#737A74]">
              {item.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span>{item.label}:</span>
            </div>
            <div className="flex items-center gap-1.5 font-data tabular-nums font-semibold">
              <span className="text-[#163829]">{item.value}</span>
              {item.delta && (
                <span
                  className={`text-[10px] font-bold ${
                    item.delta.isNegative ? 'text-[#176B4D]' : 'text-[#C04D44]'
                  }`}
                >
                  {item.delta.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {footer && (
        <div className="pt-2 border-t border-[#EEF0EA] text-[10px] text-[#737A74] font-sans">
          {footer}
        </div>
      )}
    </div>
  );
};
