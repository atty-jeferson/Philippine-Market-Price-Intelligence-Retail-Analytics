import React from 'react';
import { ChartHeader, EvidenceStatus } from './ChartHeader';
import { EmptyChartState } from './EmptyChartState';
import { InsufficientDataState } from './InsufficientDataState';
import { Info } from 'lucide-react';

interface ChartCardProps {
  id?: string;
  title: string;
  question: string;
  badge?: EvidenceStatus;
  benchmarkLabel?: string;
  topicKey?: string;
  actions?: React.ReactNode;
  legend?: React.ReactNode;
  sourceText?: string;
  observationPeriod?: string;
  sampleSize?: number;
  partialDataWarning?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  insufficientData?: {
    sampleSize: number;
    requiredMinimum?: number;
    metricLabel?: string;
  };
  onResetFilters?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  id,
  title,
  question,
  badge = 'DERIVED',
  benchmarkLabel,
  topicKey,
  actions,
  legend,
  sourceText = 'Observed Philippine Retail Shelf Data',
  observationPeriod = 'Audit Cycle Sep 2026',
  sampleSize,
  partialDataWarning,
  isLoading = false,
  isEmpty = false,
  insufficientData,
  onResetFilters,
  children,
  className = ''
}) => {
  return (
    <div
      id={id}
      className={`bg-white rounded-xl border border-[#E3E6DF] p-5 sm:p-6 shadow-card flex flex-col justify-between transition-all ${className}`}
    >
      <div>
        <ChartHeader
          title={title}
          question={question}
          badge={badge}
          benchmarkLabel={benchmarkLabel}
          topicKey={topicKey}
          actions={actions}
        />

        {partialDataWarning && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-[#FFFDF5] border border-[#F4E8B8] text-[#B8860B] text-xs flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
            <span>{partialDataWarning}</span>
          </div>
        )}

        <div className="w-full relative">
          {isLoading ? (
            <div className="h-64 w-full flex flex-col items-center justify-center space-y-2 bg-[#FAFAF7] rounded-lg animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-[#176B4D] border-t-transparent animate-spin" />
              <div className="text-xs text-[#737A74]">Synthesizing market metrics...</div>
            </div>
          ) : isEmpty ? (
            <EmptyChartState onResetFilters={onResetFilters} />
          ) : insufficientData ? (
            <InsufficientDataState
              sampleSize={insufficientData.sampleSize}
              requiredMinimum={insufficientData.requiredMinimum}
              metricLabel={insufficientData.metricLabel}
            />
          ) : (
            <>
              {children}
              {legend && <div className="mt-3 pt-3 border-t border-[#EEF0EA]">{legend}</div>}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#EEF0EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#737A74] font-sans">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[#4F5751]">{sourceText}</span>
          <span>&bull;</span>
          <span>{observationPeriod}</span>
          {sampleSize !== undefined && (
            <>
              <span>&bull;</span>
              <span className="font-data font-semibold text-[#163829]">n = {sampleSize} SKUs</span>
            </>
          )}
        </div>
        <div className="text-[10px] text-[#A8B0A8]">
          Traceable to underlying retail audits
        </div>
      </div>
    </div>
  );
};
