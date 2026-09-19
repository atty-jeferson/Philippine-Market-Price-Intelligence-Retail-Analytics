import React from 'react';
import { Database, RefreshCw } from 'lucide-react';

interface EmptyChartStateProps {
  title?: string;
  message?: string;
  onResetFilters?: () => void;
  height?: number | string;
}

export const EmptyChartState: React.FC<EmptyChartStateProps> = ({
  title = 'No observations available',
  message = 'No retail data matched the currently selected filters or criteria.',
  onResetFilters,
  height = 240
}) => {
  return (
    <div
      style={{ height }}
      className="w-full flex flex-col items-center justify-center p-6 text-center bg-[#FAFAF7] border border-dashed border-[#E3E6DF] rounded-lg"
    >
      <div className="w-10 h-10 rounded-full bg-[#EEF4EE] flex items-center justify-center text-[#176B4D] mb-3">
        <Database className="w-5 h-5 text-[#176B4D]" />
      </div>
      <h4 className="text-xs font-semibold text-[#163829] uppercase tracking-wider mb-1">
        {title}
      </h4>
      <p className="text-xs text-[#737A74] max-w-sm mb-3 leading-relaxed">
        {message}
      </p>
      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#176B4D] bg-white border border-[#E3E6DF] hover:bg-[#EEF4EE] rounded-lg transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Filter Selections</span>
        </button>
      )}
    </div>
  );
};
