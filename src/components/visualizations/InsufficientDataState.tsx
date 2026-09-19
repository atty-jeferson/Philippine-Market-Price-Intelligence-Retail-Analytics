import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface InsufficientDataStateProps {
  sampleSize: number;
  requiredMinimum?: number;
  metricLabel?: string;
  height?: number | string;
}

export const InsufficientDataState: React.FC<InsufficientDataStateProps> = ({
  sampleSize,
  requiredMinimum = 5,
  metricLabel = 'statistical distribution',
  height = 240
}) => {
  return (
    <div
      style={{ height }}
      className="w-full flex flex-col items-center justify-center p-6 text-center bg-[#FFFDF5] border border-dashed border-[#F4E8B8] rounded-lg"
    >
      <div className="w-10 h-10 rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#B8860B] mb-3">
        <AlertCircle className="w-5 h-5 text-[#C27D22]" />
      </div>
      <h4 className="text-xs font-semibold text-[#163829] uppercase tracking-wider mb-1">
        Insufficient Sample Size (n = {sampleSize})
      </h4>
      <p className="text-xs text-[#5F625D] max-w-sm mb-2 leading-relaxed">
        At least <strong className="font-semibold text-[#163829]">{requiredMinimum} verified observations</strong> are required to calculate a statistically sound {metricLabel}.
      </p>
      <div className="inline-flex items-center gap-1.5 text-[11px] text-[#B8860B] bg-[#FFFBEB] border border-[#F4E8B8] px-2.5 py-1 rounded">
        <HelpCircle className="w-3 h-3" />
        <span>Statistical standard: Avoid displaying volatile outliers or unrepresentative medians.</span>
      </div>
    </div>
  );
};
