import React from 'react';

export interface LegendItem {
  label: string;
  color: string;
  shape?: 'circle' | 'square' | 'line' | 'dashed';
  secondaryText?: string;
}

interface ChartLegendProps {
  items: LegendItem[];
  className?: string;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ items, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#4F5751] ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="inline-flex items-center gap-1.5">
          {item.shape === 'line' ? (
            <span
              className="w-4 h-0.5 inline-block rounded"
              style={{ backgroundColor: item.color }}
            />
          ) : item.shape === 'dashed' ? (
            <span
              className="w-4 h-0.5 inline-block border-b-2 border-dashed"
              style={{ borderColor: item.color }}
            />
          ) : item.shape === 'square' ? (
            <span
              className="w-2.5 h-2.5 rounded-2xs inline-block"
              style={{ backgroundColor: item.color }}
            />
          ) : (
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span className="font-medium text-[#163829]">{item.label}</span>
          {item.secondaryText && (
            <span className="text-[10px] text-[#737A74] font-data">({item.secondaryText})</span>
          )}
        </div>
      ))}
    </div>
  );
};
