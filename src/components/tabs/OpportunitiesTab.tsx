import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Tag,
  Store,
  ShieldCheck,
  ChevronRight,
  Filter,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Search,
  Crosshair,
  Info,
  Clock,
  Building2,
  X,
  ArrowRight
} from 'lucide-react';
import {
  NormalizedProduct,
  CrossRetailerSKUComparison
} from '../../types';
import {
  InvestigationOpportunity,
  detectInvestigationOpportunities,
  OpportunitySeverity,
  OpportunityType,
  OpportunityPersistence,
  OpportunityBreadth
} from '../../domain/opportunities';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';

interface OpportunitiesTabProps {
  products: NormalizedProduct[];
  crossRetailer: CrossRetailerSKUComparison[];
  marketMedian100g: number;
  onSelectProduct: (p: NormalizedProduct) => void;
  onNavigateToCompetitive?: () => void;
}

export const OpportunitiesTab: React.FC<OpportunitiesTabProps> = ({
  products,
  crossRetailer,
  marketMedian100g,
  onSelectProduct,
  onNavigateToCompetitive
}) => {
  // Generate deterministic opportunities
  const opportunities = useMemo(() => {
    return detectInvestigationOpportunities(products, crossRetailer, marketMedian100g);
  }, [products, crossRetailer, marketMedian100g]);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPersistence, setSelectedPersistence] = useState<string>('all');
  const [selectedBreadth, setSelectedBreadth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected for Modal Detail
  const [activeOpportunity, setActiveOpportunity] = useState<InvestigationOpportunity | null>(null);

  // Counts by severity
  const highCount = opportunities.filter((o) => o.severity === 'HIGH').length;
  const watchCount = opportunities.filter((o) => o.severity === 'WATCH').length;
  const lowCount = opportunities.filter((o) => o.severity === 'LOW').length;

  // Filtered List
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((o) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = o.title.toLowerCase().includes(q);
        const matchEntity = o.entity_name.toLowerCase().includes(q);
        const matchBrand = o.brand_name.toLowerCase().includes(q);
        if (!matchTitle && !matchEntity && !matchBrand) return false;
      }
      if (selectedSeverity !== 'all' && o.severity !== selectedSeverity) {
        return false;
      }
      if (selectedType !== 'all' && o.opportunity_type !== selectedType) {
        return false;
      }
      if (selectedPersistence !== 'all' && o.persistence !== selectedPersistence) {
        return false;
      }
      if (selectedBreadth !== 'all' && o.retailer_breadth !== selectedBreadth) {
        return false;
      }
      return true;
    });
  }, [opportunities, searchQuery, selectedSeverity, selectedType, selectedPersistence, selectedBreadth]);

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Opportunities"
        subtitle="Prioritized queue of deterministic, evidence-grounded price gaps, channel anomalies, and competitive signals."
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="price_volatility" label="Opportunity Logic & Criteria" />
            <EvidenceBadge status="Derived" size="md" />
          </div>
        }
      />

      {/* 2. STRICT COMPLIANCE DISCLAIMER */}
      <div className="bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl p-4 text-xs text-[#4F5751] flex items-start gap-3 shadow-2xs font-sans">
        <Info className="w-4 h-4 text-[#176B4D] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-[#163829] block text-[11px] uppercase tracking-wider font-bold">
            Commercial Surveillance Standard
          </strong>
          <p className="leading-relaxed">
            Investigation opportunities are <strong>evidence-based analytical prompts</strong> for commercial, category, and pricing teams.
            They are strictly deterministic and explainable. They do <em>not</em> forecast sales volume, calculate demand elasticity, or recommend automated price changes without proprietary margin data.
          </p>
        </div>
      </div>

      {/* 3. EXECUTIVE SUMMARY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <KPICard
          label="IDENTIFIED SIGNALS"
          value={opportunities.length}
          unit="Signals"
          evidenceStatus="Derived"
          context="Full Catalog"
        />

        <KPICard
          label="HIGH PRIORITY"
          value={highCount}
          unit="Critical"
          evidenceStatus="Derived"
          context="Material gap & broad evidence"
          changeDirection="negative"
        />

        <KPICard
          label="WATCHLIST"
          value={watchCount}
          unit="Active"
          evidenceStatus="Derived"
          context="Moderate or emerging gap"
          changeDirection="neutral"
        />

        <KPICard
          label="INFORMATIONAL"
          value={lowCount}
          unit="Tracked"
          evidenceStatus="Derived"
          context="Narrow or minor delta"
        />
      </div>

      {/* 4. FILTER BAR */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] p-4 sm:p-5 shadow-card space-y-3.5 font-sans">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737A74]" />
            <input
              type="text"
              placeholder="Search opportunity title, product, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] placeholder-[#737A74] focus:outline-none focus:border-[#176B4D]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737A74] hover:text-[#163829]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#737A74] text-[11px] font-medium">Severity:</span>
            {['all', 'HIGH', 'WATCH', 'LOW'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeverity(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedSeverity === s
                    ? 'bg-[#176B4D] text-white'
                    : 'bg-[#FAFAF7] text-[#4F5751] hover:bg-[#E3E6DF]'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#EEF0EA] text-xs">
          {/* Opportunity Type */}
          <div>
            <label className="block text-[10px] font-bold text-[#737A74] uppercase tracking-wider mb-1">
              Signal Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Signal Types</option>
              <option value="retailer_gap">Cross-Retailer Price Dispersion</option>
              <option value="above_benchmark">Elevated Unit Price Premium</option>
              <option value="below_benchmark">High Unit-Cost Advantage</option>
              <option value="competitive_pressure">Direct Competitive Pressure</option>
              <option value="promotion_dependency">Promotional Dependency</option>
              <option value="persistent_movement">Persistent Longitudinal Movement</option>
            </select>
          </div>

          {/* Historical Persistence */}
          <div>
            <label className="block text-[10px] font-bold text-[#737A74] uppercase tracking-wider mb-1">
              Persistence
            </label>
            <select
              value={selectedPersistence}
              onChange={(e) => setSelectedPersistence(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Observations</option>
              <option value="persistent">Persistent (Longitudinal / Multi-Point)</option>
              <option value="temporary">Temporary / Single Audit</option>
            </select>
          </div>

          {/* Retailer Breadth */}
          <div>
            <label className="block text-[10px] font-bold text-[#737A74] uppercase tracking-wider mb-1">
              Retailer Breadth
            </label>
            <select
              value={selectedBreadth}
              onChange={(e) => setSelectedBreadth(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Channels</option>
              <option value="broad">Broad (3+ Retailer Banners)</option>
              <option value="narrow">Narrow (1-2 Retailers)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. OPPORTUNITY SIGNAL CARDS (PER SECTION 11 SPEC) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#737A74]">
          <div>
            Showing <strong className="text-[#163829]">{filteredOpportunities.length}</strong> prioritized opportunities
          </div>
          <div className="font-mono text-[11px]">
            Ranked by: <strong>Deterministic Severity &amp; Breadth</strong>
          </div>
        </div>

        {filteredOpportunities.length === 0 ? (
          <div className="p-10 bg-white border border-[#E3E6DF] rounded-xl text-center text-xs text-[#737A74]">
            No opportunities match the selected filters. Try broadening your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOpportunities.map((opp) => {
              const isHigh = opp.severity === 'HIGH';
              const isWatch = opp.severity === 'WATCH';

              return (
                <div
                  key={opp.opportunity_id}
                  className={`bg-white rounded-xl border transition-all p-5 sm:p-6 shadow-card hover:shadow-card-hover ${
                    isHigh
                      ? 'border-[#FECDD3] border-l-4 border-l-[#E11D48]'
                      : isWatch
                      ? 'border-[#FEEBB5] border-l-4 border-l-[#B8860B]'
                      : 'border-[#E3E6DF] border-l-4 border-l-[#176B4D]'
                  }`}
                >
                  {/* TOP ROW: Signal Type Badge | Severity Pill | Entity Name */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EEF0EA] font-sans">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-[0.06em] px-2 py-0.5 rounded-md bg-[#FAFAF7] border border-[#E3E6DF] text-[#4F5751]">
                        {opp.opportunity_type.replace('_', ' ').toUpperCase()}
                      </span>

                      <span
                        className={`text-[10px] uppercase font-bold tracking-[0.06em] px-2 py-0.5 rounded-md ${
                          isHigh
                            ? 'bg-[#FFE4E6] text-[#9F1239]'
                            : isWatch
                            ? 'bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5]'
                            : 'bg-[#EEF4EE] text-[#176B4D]'
                        }`}
                      >
                        {opp.severity} PRIORITY
                      </span>

                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        opp.persistence === 'persistent'
                          ? 'bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1]'
                          : 'bg-[#FAFAF7] text-[#737A74]'
                      }`}>
                        {opp.persistence === 'persistent' ? '● Persistent' : '○ Single Audit'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#163829]">
                        {opp.brand_name} &middot; <span className="font-normal text-[#737A74]">{opp.entity_name}</span>
                      </span>
                    </div>
                  </div>

                  {/* TITLE & SUMMARY */}
                  <div className="mt-3.5 space-y-1.5 font-sans">
                    <h3 className="text-sm font-bold text-[#163829]">
                      {opp.title}
                    </h3>
                    <p className="text-xs text-[#4F5751] leading-relaxed">
                      {opp.summary}
                    </p>
                  </div>

                  {/* MIDDLE: Observed Signal vs Benchmark */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                    <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF] space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold">
                        Observed Signal (Data Fact)
                      </div>
                      <div className="text-sm font-bold font-data tabular-nums text-[#163829]">
                        {opp.observed_formatted}
                      </div>
                      <div className="text-[11px] text-[#737A74]">
                        Channels observed: {opp.retailers_observed} ({opp.retailer_names.join(', ') || 'Across audited banners'})
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF] space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold">
                        Benchmark Reference &amp; Delta
                      </div>
                      <div className="text-sm font-bold font-data tabular-nums text-[#163829] flex items-center gap-2">
                        <span>{opp.benchmark_formatted}</span>
                        <span
                          className={`text-xs font-bold ${
                            opp.difference_percent > 0 ? 'text-[#B45309]' : 'text-[#176B4D]'
                          }`}
                        >
                          ({opp.difference_formatted})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#737A74]">
                        Metric baseline: {opp.metric_name}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM: Suggested Commercial Action / Investigation */}
                  <div className="mt-4 pt-3.5 border-t border-[#EEF0EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                    <div className="space-y-0.5 flex-1">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-[#176B4D] flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-[#176B4D]" />
                        <span>Recommended Investigation</span>
                      </div>
                      <p className="text-xs text-[#163829] font-medium">
                        {opp.recommended_investigation[0]}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveOpportunity(opp)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#176B4D] hover:bg-[#163829] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Investigate Evidence</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. INVESTIGATION DETAILS MODAL */}
      {activeOpportunity && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-floating border border-[#E3E6DF] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#163829] flex items-start justify-between font-sans">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    activeOpportunity.severity === 'HIGH'
                      ? 'bg-[#E11D48] text-white'
                      : activeOpportunity.severity === 'WATCH'
                      ? 'bg-[#B8860B] text-white'
                      : 'bg-[#176B4D] text-white'
                  }`}>
                    {activeOpportunity.severity} PRIORITY
                  </span>
                  <span className="text-[#176B4D] font-bold">
                    {activeOpportunity.opportunity_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-bold mt-1 text-[#163829]">
                  {activeOpportunity.title}
                </h3>
                <div className="text-xs text-[#737A74]">
                  Target Entity: <span className="font-semibold text-[#163829]">{activeOpportunity.entity_name}</span> ({activeOpportunity.brand_name})
                </div>
              </div>

              <button
                onClick={() => setActiveOpportunity(null)}
                className="p-1.5 rounded-lg hover:bg-[#EEF4EE] text-[#737A74] hover:text-[#163829] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#4F5751] font-sans">
              {/* Metric Comparison Ribbon */}
              <div className="bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-[#737A74] uppercase font-bold">Observed Price</div>
                  <div className="text-base font-bold font-data tabular-nums text-[#163829] mt-1">{activeOpportunity.observed_formatted}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#737A74] uppercase font-bold">Benchmark Reference</div>
                  <div className="text-base font-bold font-data tabular-nums text-[#737A74] mt-1">{activeOpportunity.benchmark_formatted}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#737A74] uppercase font-bold">Empirical Delta</div>
                  <div className={`text-base font-bold font-data tabular-nums mt-1 ${activeOpportunity.difference_percent > 0 ? 'text-[#B45309]' : 'text-[#176B4D]'}`}>
                    {activeOpportunity.difference_formatted}
                  </div>
                </div>
              </div>

              {/* Verified Observational Evidence */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#163829] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#176B4D]" />
                  <span>Verified Observational Evidence</span>
                </h4>
                <div className="bg-[#EEF4EE] border border-[#DDEBE1] rounded-xl p-4 space-y-1.5">
                  {activeOpportunity.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 text-[#163829]">
                      <span className="text-[#176B4D] font-bold">&bull;</span>
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observations & Channels Metadata */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="bg-[#FAFAF7] border border-[#E3E6DF] p-3 rounded-xl space-y-0.5">
                  <div className="font-bold text-[#163829]">Channel Scope:</div>
                  <div className="text-[#737A74]">
                    {activeOpportunity.retailers_observed} banners observed ({activeOpportunity.retailer_names.join(', ') || 'Various'})
                  </div>
                </div>
                <div className="bg-[#FAFAF7] border border-[#E3E6DF] p-3 rounded-xl space-y-0.5">
                  <div className="font-bold text-[#163829]">Audit Timeframe &amp; Promo:</div>
                  <div className="text-[#737A74]">
                    {activeOpportunity.date_range} &bull; {activeOpportunity.promotion_status}
                  </div>
                </div>
              </div>

              {/* Recommended Commercial Investigations */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#163829] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-[#176B4D]" />
                  <span>Recommended Commercial Investigations</span>
                </h4>
                <div className="bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl p-4 space-y-2 text-[#163829]">
                  {activeOpportunity.recommended_investigation.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="font-bold font-data text-[#176B4D] mt-0.5">0{i + 1}.</span>
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodological Caveats */}
              <div className="bg-[#FFFDF5] border border-[#FEEBB5] rounded-xl p-3.5 text-[11px] text-[#B8860B] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Enterprise Limitations</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[#B8860B]">
                  {activeOpportunity.limitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAFAF7] border-t border-[#E3E6DF] flex items-center justify-between">
              <button
                onClick={() => setActiveOpportunity(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#737A74] hover:text-[#163829] cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {activeOpportunity.anchor_product && (
                  <button
                    onClick={() => {
                      onSelectProduct(activeOpportunity.anchor_product!);
                      setActiveOpportunity(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E3E6DF] text-xs font-semibold text-[#163829] hover:bg-[#FAFAF7] cursor-pointer shadow-xs"
                  >
                    View in Price Explorer
                  </button>
                )}

                {onNavigateToCompetitive && (
                  <button
                    onClick={() => {
                      setActiveOpportunity(null);
                      onNavigateToCompetitive();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#176B4D] text-white text-xs font-semibold hover:bg-[#163829] cursor-pointer shadow-xs"
                  >
                    View in Competitive Landscape
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
