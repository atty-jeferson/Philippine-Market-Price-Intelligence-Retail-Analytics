import React from 'react';
import { LearnTooltip } from '../common/LearnTooltip';

export type EvidenceStatus = 'OBSERVED' | 'DERIVED' | 'ESTIMATED' | 'INFERRED' | 'BENCHMARK';

interface ChartHeaderProps {
  title: string;
  question: string;
  badge?: EvidenceStatus;
  benchmarkLabel?: string;
  topicKey?: string;
  actions?: React.ReactNode;
}

const BADGE_STYLES: Record<EvidenceStatus, { bg: string; text: string; border: string }> = {
  OBSERVED: { bg: 'bg-[#EEF4EE]', text: 'text-[#176B4D]', border: 'border-[#DDEBE1]' },
  DERIVED: { bg: 'bg-[#F4F5EF]', text: 'text-[#3B4840]', border: 'border-[#E3E6DF]' },
  ESTIMATED: { bg: 'bg-[#FFFDF5]', text: 'text-[#B8860B]', border: 'border-[#F4E8B8]' },
  INFERRED: { bg: 'bg-[#F4F5EF]', text: 'text-[#5F625D]', border: 'border-[#E3E6DF]' },
  BENCHMARK: { bg: 'bg-[#FAFAF7]', text: 'text-[#737A74]', border: 'border-[#E3E6DF]' }
};

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  title,
  question,
  badge = 'DERIVED',
  benchmarkLabel,
  topicKey,
  actions
}) => {
  const badgeStyle = BADGE_STYLES[badge] || BADGE_STYLES.DERIVED;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#EEF0EA] pb-3 mb-4">
      <div className="space-y-1 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-wider border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
          >
            {badge}
          </span>
          {benchmarkLabel && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-medium bg-[#FAFAF7] text-[#4F5751] border border-[#E3E6DF]">
              Ref: {benchmarkLabel}
            </span>
          )}
          <h3 className="text-sm sm:text-base font-bold text-[#163829] tracking-tight font-sans">
            {title}
          </h3>
          {topicKey && <LearnTooltip topicKey={topicKey} iconOnly />}
        </div>
        <p className="text-xs text-[#4F5751] font-normal leading-relaxed">
          <span className="font-semibold text-[#163829]">Analytical Question:</span> {question}
        </p>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
