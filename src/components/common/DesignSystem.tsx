import React from 'react';
import {
  Info,
  AlertCircle,
  Database,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { EvidenceStatus } from '../../types';
import { TOKENS } from '../../lib/tokens';

// ============================================================================
// 1. EVIDENCE BADGE (Epistemic Status: Observed, Normalized, Derived, etc.)
// ============================================================================
export interface EvidenceBadgeProps {
  status?: EvidenceStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({
  status = 'Observed',
  size = 'sm',
  className = ''
}) => {
  const norm = (status || 'Observed').toLowerCase();

  const configs: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    observed: {
      bg: 'bg-[#EEF4EE]',
      text: 'text-[#176B4D]',
      border: 'border-[#DDEBE1]',
      dot: 'bg-[#176B4D]',
      label: 'OBSERVED'
    },
    normalized: {
      bg: 'bg-[#EAF4ED]',
      text: 'text-[#176B4D]',
      border: 'border-[#DDEBE1]',
      dot: 'bg-[#176B4D]',
      label: 'NORMALIZED'
    },
    derived: {
      bg: 'bg-[#F4F5EF]',
      text: 'text-[#3B4840]',
      border: 'border-[#E3E6DF]',
      dot: 'bg-[#4B735E]',
      label: 'DERIVED'
    },
    signal: {
      bg: 'bg-[#FFFDF5]',
      text: 'text-[#B8860B]',
      border: 'border-[#F4E8B8]',
      dot: 'bg-[#C27D22]',
      label: 'SIGNAL'
    },
    opportunity: {
      bg: 'bg-[#EAF4ED]',
      text: 'text-[#176B4D]',
      border: 'border-[#A8C5B4]',
      dot: 'bg-[#176B4D]',
      label: 'OPPORTUNITY'
    },
    estimated: {
      bg: 'bg-[#FFFDF5]',
      text: 'text-[#B8860B]',
      border: 'border-[#F4E8B8]',
      dot: 'bg-[#C27D22]',
      label: 'ESTIMATED'
    },
    inferred: {
      bg: 'bg-[#F4F5EF]',
      text: 'text-[#5F625D]',
      border: 'border-[#E3E6DF]',
      dot: 'bg-[#777A74]',
      label: 'INFERRED'
    },
    verified: {
      bg: 'bg-[#EAF4ED]',
      text: 'text-[#176B4D]',
      border: 'border-[#DDEBE1]',
      dot: 'bg-[#176B4D]',
      label: 'VERIFIED'
    }
  };

  const current = configs[norm] || configs.observed;
  const sizeClasses = size === 'sm'
    ? 'text-[9px] px-1.5 py-0.5 tracking-wider font-semibold'
    : 'text-[10px] px-2 py-0.5 tracking-wider font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans uppercase rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeClasses} ${className}`}
      title={`Epistemic Level: ${current.label} — Verified per THE GROCER methodology.`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};

// ============================================================================
// 2. MARKET CONTEXT BREADCRUMB
// ============================================================================
export interface MarketContextProps {
  country?: string;
  sector?: string;
  category?: string;
  subCategory?: string;
  className?: string;
}

export const MarketContext: React.FC<MarketContextProps> = ({
  country = 'PHILIPPINES',
  sector = 'FMCG',
  category = 'ORAL CARE',
  subCategory = 'TOOTHPASTE',
  className = ''
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[10px] font-sans font-medium text-[#737A74] uppercase tracking-wider ${className}`}
    >
      <span className="text-[#163829] font-semibold">{country}</span>
      <span className="text-[#E3E6DF]">/</span>
      <span className="text-[#163829] font-semibold">{sector}</span>
      <span className="text-[#E3E6DF]">/</span>
      <span className="text-[#163829] font-semibold">{category}</span>
      <span className="text-[#E3E6DF]">/</span>
      <span className="text-[#176B4D] font-bold px-1.5 py-0.2 rounded bg-[#EAF4ED] border border-[#DDEBE1]">
        {subCategory}
      </span>
    </div>
  );
};

// ============================================================================
// 3. EVIDENCE PIPELINE (The Data → Intelligence Story)
// ============================================================================
export interface EvidencePipelineProps {
  activeStage?: 'observed' | 'normalized' | 'derived' | 'signal' | 'opportunity' | 'all';
  className?: string;
  compact?: boolean;
}

export const EvidencePipeline: React.FC<EvidencePipelineProps> = ({
  activeStage = 'all',
  className = '',
  compact = false
}) => {
  const stages = [
    { id: 'observed', label: 'OBSERVED', desc: 'Shelf price & GTIN' },
    { id: 'normalized', label: 'NORMALIZED', desc: 'Net weight standard (₱/100g)' },
    { id: 'derived', label: 'DERIVED', desc: 'RPP, price index & benchmark' },
    { id: 'signal', label: 'SIGNAL', desc: 'Deterministic market anomaly' },
    { id: 'opportunity', label: 'OPPORTUNITY', desc: 'Commercial action' }
  ];

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 flex-wrap ${className}`}>
      {stages.map((st, idx) => {
        const isActive = activeStage === 'all' || activeStage === st.id;
        return (
          <React.Fragment key={st.id}>
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all ${
                isActive
                  ? 'bg-white border border-[#A8C5B4] shadow-xs text-[#163829] font-semibold'
                  : 'bg-[#FAFAF7] border border-[#E3E6DF] text-[#737A74]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#176B4D]' : 'bg-[#E8E7DF]'}`} />
              <span className="text-[10px] font-sans font-bold tracking-wider">{st.label}</span>
              {!compact && (
                <span className="hidden xl:inline text-[10px] text-[#737A74]">
                  ({st.desc})
                </span>
              )}
            </div>
            {idx < stages.length - 1 && (
              <span className="text-[#A8C5B4] text-xs select-none">&rarr;</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================================
// 4. PAGE HEADER (Unified Page Title & Context)
// ============================================================================
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  isDemoData?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow = 'PHILIPPINE RETAIL MARKET INTELLIGENCE',
  actions,
  isDemoData = true
}) => {
  return (
    <header className="border-b border-[#E3E6DF] pb-6 mb-7">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737A74]">
              {eyebrow}
            </span>
            <span className="text-[#E3E6DF]">|</span>
            <MarketContext />
            {isDemoData && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFFDF5] text-[#B8860B] border border-[#F4E8B8] text-[9px] font-sans font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C27D22]" />
                DEMO DATA
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163829] font-sans">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[#4F5751] mt-2 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

// ============================================================================
// 5. PRIMARY INSIGHT (EDITORIAL HERO CALLOUT)
// ============================================================================
export interface PrimaryInsightProps {
  label: string;
  value: string | number;
  unit?: string;
  comparisonText?: string;
  takeaway: string;
  evidenceStatus?: EvidenceStatus | string;
  sparklineData?: number[];
  className?: string;
}

export const PrimaryInsight: React.FC<PrimaryInsightProps> = ({
  label,
  value,
  unit,
  comparisonText,
  takeaway,
  evidenceStatus,
  sparklineData,
  className = ''
}) => {
  return (
    <section className={`border-b border-[#E3E6DF] pb-7 mb-8 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#737A74]">
          {label}
        </span>
        {evidenceStatus && <EvidenceBadge status={evidenceStatus} size="sm" />}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-4xl sm:text-5xl lg:text-6xl font-bold font-data text-[#163829] tracking-tight leading-none tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-base sm:text-lg font-data font-semibold text-[#737A74]">
              {unit}
            </span>
          )}
          {comparisonText && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-sans font-semibold text-[#176B4D] bg-[#EAF4ED] border border-[#DDEBE1] px-2 py-0.5 rounded-full">
              {comparisonText}
            </span>
          )}
        </div>

        <div className="max-w-xl text-sm sm:text-[15px] text-[#3B4840] leading-relaxed">
          <span className="font-semibold text-[#163829]">Key Takeaway: </span>
          {takeaway}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 6. METRIC ROW & KPI CARD (Restrained, Analytical Metrics)
// ============================================================================
export interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  changeDirection?: 'positive' | 'negative' | 'neutral';
  evidenceStatus?: EvidenceStatus | string;
  context?: string;
  tooltip?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  unit,
  change,
  changeDirection = 'neutral',
  evidenceStatus,
  context,
  tooltip,
  icon,
  className = ''
}) => {
  const getChangeColor = () => {
    if (changeDirection === 'positive') return 'text-[#176B4D] bg-[#EAF4ED] border-[#DDEBE1]';
    if (changeDirection === 'negative') return 'text-[#C04D44] bg-[#FDF4F3] border-[#F5C8C4]';
    return 'text-[#4F5751] bg-[#FAFAF7] border-[#E3E6DF]';
  };

  return (
    <div
      className={`bg-white border border-[#E3E6DF] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-card hover:border-[#A8C5B4] transition-all duration-200 ${className}`}
      title={tooltip}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#737A74] truncate">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {evidenceStatus && <EvidenceBadge status={evidenceStatus} size="sm" />}
          {icon && (
            <div className="w-6 h-6 rounded-md bg-[#FAFAF7] border border-[#E3E6DF] flex items-center justify-center text-[#737A74]">
              {icon}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-2">
        <span className="text-2xl sm:text-[28px] font-bold font-data text-[#163829] tracking-tight leading-none tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-data font-semibold text-[#737A74]">
            {unit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#FAFAF7] text-[11px]">
        {change ? (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-data font-semibold ${getChangeColor()}`}>
            {change}
          </span>
        ) : (
          <span className="text-[10px] font-data text-[#A8B0A8]">—</span>
        )}
        {context && (
          <span className="text-[11px] text-[#737A74] truncate font-sans">
            {context}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 7. SECTION HEADER
// ============================================================================
export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 ${className}`}>
      <div>
        {eyebrow && (
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737A74] block mb-1">
            {eyebrow}
          </span>
        )}
        <h2 className="text-lg sm:text-xl font-bold text-[#163829] tracking-tight font-sans">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-[#737A74] mt-0.5 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
};

// ============================================================================
// 8. OPPORTUNITY SIGNAL (Restructured as Strategic Intelligence)
// ============================================================================
export interface OpportunityCardProps {
  type: string;
  title: string;
  hypothesis: string;
  deltaPercent?: number | string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceCount?: number;
  retailer?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  type,
  title,
  hypothesis,
  deltaPercent,
  severity,
  evidenceCount,
  retailer,
  actionLabel = 'Inspect Signal',
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`bg-white border rounded-xl p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between ${
        severity === 'HIGH' ? 'border-[#F4E8B8] bg-gradient-to-r from-white to-[#FFFDF5]' : 'border-[#E3E6DF]'
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                severity === 'HIGH'
                  ? 'bg-[#FDF4F3] text-[#C04D44] border border-[#F5C8C4]'
                  : 'bg-[#FFFDF5] text-[#B8860B] border border-[#F4E8B8]'
              }`}
            >
              {severity} PRIORITY
            </span>
            <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-[#737A74]">
              {type}
            </span>
          </div>

          {deltaPercent !== undefined && (
            <span className="text-xs font-data font-bold text-[#163829] bg-[#FAFAF7] border border-[#E3E6DF] px-2 py-0.5 rounded tabular-nums">
              {typeof deltaPercent === 'number' ? `${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}%` : deltaPercent}
            </span>
          )}
        </div>

        <h3 className="font-bold text-sm text-[#163829] hover:text-[#176B4D] transition-colors leading-snug">
          {title}
        </h3>
        <p className="text-xs text-[#4F5751] mt-1.5 leading-relaxed">
          {hypothesis}
        </p>
      </div>

      <div className="pt-4 mt-3 border-t border-[#FAFAF7] flex items-center justify-between text-xs">
        <div className="text-[11px] text-[#737A74] font-sans">
          {evidenceCount !== undefined && <span>{evidenceCount} verified observations</span>}
          {retailer && <span className="ml-1.5 font-semibold text-[#163829]">• {retailer}</span>}
        </div>

        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#176B4D] hover:text-[#13583E] transition-colors cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 9. INSUFFICIENT DATA & EMPTY STATES
// ============================================================================
export const InsufficientDataState: React.FC<{ message?: string; requirement?: string }> = ({
  message = 'There are not enough observations to calculate a statistically reliable estimate.',
  requirement
}) => {
  return (
    <div className="py-10 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto">
      <div className="w-10 h-10 rounded-full bg-[#FFFDF5] border border-[#F4E8B8] flex items-center justify-center text-[#B8860B] mb-3 shadow-xs">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-bold text-[#163829] uppercase tracking-wider font-sans">
        INSUFFICIENT DATA
      </h4>
      <p className="text-xs text-[#737A74] mt-1.5 leading-relaxed">
        {message}
      </p>
      {requirement && (
        <div className="mt-3 text-[11px] font-sans text-[#B8860B] bg-[#FFFDF5] border border-[#F4E8B8] px-3 py-1 rounded-md">
          Requirement: {requirement}
        </div>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{ title?: string; message?: string }> = ({
  title = 'NO OBSERVATIONS',
  message = 'No verified price observations are available for this selection.'
}) => {
  return (
    <div className="py-10 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto">
      <div className="w-10 h-10 rounded-full bg-[#FAFAF7] border border-[#E3E6DF] flex items-center justify-center text-[#737A74] mb-3 shadow-xs">
        <Database className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-bold text-[#163829] uppercase tracking-wider font-sans">
        {title}
      </h4>
      <p className="text-xs text-[#737A74] mt-1.5 leading-relaxed">
        {message}
      </p>
    </div>
  );
};

