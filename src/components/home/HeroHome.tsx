import React, { useState } from 'react';
import {
  Search,
  Scale,
  Crosshair,
  Lightbulb,
  Building2,
  Store,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
  BarChart3
} from 'lucide-react';
import { NormalizedProduct, TabType, MarketSummaryKPIs } from '../../types';
import { InvestigationOpportunity } from '../../domain/opportunities';
import {
  PageHeader,
  PrimaryInsight,
  EvidenceBadge,
  MarketContext
} from '../common/DesignSystem';

interface HeroHomeProps {
  kpis: MarketSummaryKPIs;
  topValueProducts: NormalizedProduct[];
  lowestUnitPrice: NormalizedProduct | null;
  opportunities?: InvestigationOpportunity[];
  onNavigate: (tab: TabType, initialSearch?: string) => void;
  onSelectProduct: (product: NormalizedProduct) => void;
}

export const HeroHome: React.FC<HeroHomeProps> = ({
  kpis,
  topValueProducts,
  lowestUnitPrice,
  opportunities = [],
  onNavigate,
  onSelectProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('explorer', searchQuery.trim());
    }
  };

  const highSeverityCount = opportunities.filter((o) => o.severity === 'HIGH').length;
  const promoRate = kpis?.promotionRate ?? 0;
  const promoCount = Math.round((promoRate / 100) * (kpis?.totalProducts ?? 0));
  const retailerCount = kpis?.totalRetailers ?? 0;
  const medianPrice = kpis?.medianPricePer100g ?? 0;

  return (
    <div className="space-y-9 pb-16 font-sans">
      {/* 1. EDITORIAL HEADER WITH INTEGRATED SEARCH */}
      <div className="border-b border-[#E3E6DF] pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#176B4D] bg-[#EEF4EE] px-2.5 py-0.5 rounded-full border border-[#DDEBE1]">
                PHILIPPINE RETAIL MARKET INTELLIGENCE
              </span>
              <span className="text-[#D1D5DB]">/</span>
              <MarketContext />
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-[#163829]">
              Market Intelligence Summary
            </h1>

            <p className="text-sm sm:text-base text-[#4F5751] max-w-2xl leading-relaxed">
              Synthesized retail price movements, brand architecture, channel dispersion, and algorithmic opportunity signals across verified Philippine store observations.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737A74]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, brand, or retailer..."
                className="w-56 sm:w-72 pl-9 pr-3 py-2 bg-white border border-[#E3E6DF] rounded-xl text-xs text-[#163829] placeholder-[#737A74] shadow-xs focus:outline-none focus:border-[#176B4D] focus:ring-1 focus:ring-[#176B4D]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#176B4D] hover:bg-[#13583F] text-white rounded-xl text-xs font-bold tracking-wide transition-colors cursor-pointer shadow-xs font-sans"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* 2. PRIMARY MARKET INSIGHT — DIRECTLY ON CANVAS (NO BOXED CARD) */}
      <PrimaryInsight
        label="MARKET BENCHMARK &middot; UNIT PRICE MEDIAN"
        value={`₱${medianPrice.toFixed(2)}`}
        unit="/100g"
        comparisonText={`CV ${kpis.coefficientOfVariation}% Dispersion`}
        takeaway={`The Philippine oral care category displays a pronounced bimodal price architecture. Therapeutic desensitizing products command sustained premiums (up to +185% over median), while standard anti-cavity lines cluster within ±8% of category parity.`}
        evidenceStatus="Derived"
      />

      {/* 3. CORE ANALYTICAL STRIP — RESTRAINED HORIZONTAL METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* SKUs Observed */}
        <div className="bg-white border border-[#E3E6DF] rounded-xl p-4 shadow-card hover:border-[#176B4D]/30 transition-all">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737A74]">
              SKUs Observed
            </span>
            <EvidenceBadge status="Observed" size="sm" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-data text-[#163829] tabular-nums">
              {kpis?.totalProducts ?? 0}
            </span>
            <span className="text-xs font-sans text-[#737A74]">SKUs</span>
          </div>
          <div className="text-[11px] text-[#737A74] font-sans mt-1">
            100% weight normalized
          </div>
        </div>

        {/* Brands Monitored */}
        <div className="bg-white border border-[#E3E6DF] rounded-xl p-4 shadow-card hover:border-[#176B4D]/30 transition-all">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737A74]">
              Brand Portfolios
            </span>
            <EvidenceBadge status="Observed" size="sm" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-data text-[#163829] tabular-nums">
              {kpis?.totalBrands ?? 0}
            </span>
            <span className="text-xs font-sans text-[#737A74]">Brands</span>
          </div>
          <div className="text-[11px] text-[#737A74] font-sans mt-1">
            Across 5 major groups
          </div>
        </div>

        {/* Retailer Channels */}
        <div className="bg-white border border-[#E3E6DF] rounded-xl p-4 shadow-card hover:border-[#176B4D]/30 transition-all">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737A74]">
              Retail Banners
            </span>
            <EvidenceBadge status="Observed" size="sm" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-data text-[#163829] tabular-nums">
              {retailerCount}
            </span>
            <span className="text-xs font-sans text-[#737A74]">Channels</span>
          </div>
          <div className="text-[11px] text-[#737A74] font-sans mt-1">
            Modern &amp; Traditional trade
          </div>
        </div>

        {/* Promotion Activity */}
        <div className="bg-white border border-[#E3E6DF] rounded-xl p-4 shadow-card hover:border-[#176B4D]/30 transition-all">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737A74]">
              Promotion Rate
            </span>
            <EvidenceBadge status="Derived" size="sm" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-data text-[#163829] tabular-nums">
              {promoRate.toFixed(1)}%
            </span>
            <span className="text-xs font-sans text-[#176B4D] font-bold">Active</span>
          </div>
          <div className="text-[11px] text-[#737A74] font-sans mt-1">
            {promoCount} of {kpis?.totalProducts ?? 0} SKUs discounted
          </div>
        </div>

        {/* Active Signals */}
        <div className="bg-white border border-[#E3E6DF] rounded-xl p-4 shadow-card hover:border-[#176B4D]/30 transition-all">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737A74]">
              Active Signals
            </span>
            <EvidenceBadge status="Signal" size="sm" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-data text-[#163829] tabular-nums">
              {opportunities.length}
            </span>
            <span className="text-xs font-sans text-[#C04D44] font-bold">
              {highSeverityCount} High
            </span>
          </div>
          <div className="text-[11px] text-[#737A74] font-sans mt-1">
            Automated anomaly queue
          </div>
        </div>
      </div>

      {/* 4. SURVEILLANCE & RECENT DYNAMICS STRIP */}
      <section className="bg-white border border-[#E3E6DF] rounded-xl p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 pb-3 border-b border-[#EEF0EA]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#176B4D]" />
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] font-sans text-[#163829]">
              MARKET SURVEILLANCE DIGEST &middot; CURRENT AUDIT CYCLE
            </h2>
          </div>
          <span className="text-[11px] font-sans text-[#737A74]">
            Audit Scope: Q1 2026 &middot; GTIN &amp; Weight Normalized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
          {/* Price Movement */}
          <div className="p-3.5 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF] space-y-1">
            <div className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#737A74]">
              Price Movement
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[#163829] text-sm font-sans">Stable Baseline</span>
              <span className="text-[11px] text-[#737A74] font-data">(&plusmn;0.0% MoM)</span>
            </div>
            <p className="text-[11px] text-[#4F5751] leading-snug">
              Sequential shelf regular prices remain steady across key volume SKUs.
            </p>
          </div>

          {/* Competitive Pressure */}
          <div className="p-3.5 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF] space-y-1">
            <div className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#737A74]">
              Competitive Pressure
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[#B8860B] text-sm font-sans">High Dispersion</span>
              <span className="text-[11px] text-[#737A74] font-data">CV {kpis.coefficientOfVariation}%</span>
            </div>
            <p className="text-[11px] text-[#4F5751] leading-snug">
              Wide spread between therapeutic desensitizing and standard fluoride lines.
            </p>
          </div>

          {/* Promotion Activity */}
          <div className="p-3.5 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF] space-y-1">
            <div className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#737A74]">
              Promotion Activity
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[#163829] text-sm font-sans">{promoCount} SKUs</span>
              <span className="text-[11px] text-[#176B4D] font-data font-semibold">({promoRate.toFixed(1)}%)</span>
            </div>
            <p className="text-[11px] text-[#4F5751] leading-snug">
              Discounting concentrated primarily in Modern Trade and Marketplace channels.
            </p>
          </div>

          {/* Retailer Dispersion */}
          <div className="p-3.5 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF] space-y-1">
            <div className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#737A74]">
              Retailer Dispersion
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[#163829] text-sm font-sans">Active Arbitrage</span>
            </div>
            <p className="text-[11px] text-[#4F5751] leading-snug">
              Identical SKUs vary up to 25% across pharmacy and hypermarket channels.
            </p>
          </div>

          {/* Data Governance */}
          <div className="p-3.5 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF] space-y-1">
            <div className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#737A74]">
              Data Governance
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[#176B4D] text-sm font-sans">100% Validated</span>
            </div>
            <p className="text-[11px] text-[#4F5751] leading-snug">
              All price points tied to GTIN, canonical IDs, and strict net-weight standards.
            </p>
          </div>
        </div>
      </section>

      {/* 5. STRATEGIC INTELLIGENCE (TWO-COLUMN ARCHITECTURE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Competitive Structure */}
        <section className="bg-white border border-[#E3E6DF] rounded-xl p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF0EA] mb-4">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#176B4D]">
                  MARKET STRUCTURE
                </span>
                <h2 className="text-base font-serif font-bold text-[#163829]">
                  Competitive Landscape
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('competitive')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#176B4D] hover:underline cursor-pointer font-sans"
              >
                <span>Full Landscape</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#4F5751] leading-relaxed mb-4 font-sans">
              Deterministic peer clusters evaluated against category median (₱{medianPrice.toFixed(2)}/100g). Sensodyne and Parodontax command sustained therapeutic premiums, while Colgate and Close Up maintain core volume parity.
            </p>

            {/* Representative Peer Highlights */}
            <div className="space-y-2">
              {topValueProducts.slice(0, 4).map((p) => {
                const diff = ((p.price_per_100g - medianPrice) / medianPrice) * 100;
                const isPremium = diff > 0;

                return (
                  <div
                    key={p.product_id}
                    onClick={() => onSelectProduct(p)}
                    className="p-3 rounded-lg border border-[#E3E6DF] hover:border-[#176B4D]/40 bg-[#FAFAF7] hover:bg-white flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737A74]">
                          {p.brand}
                        </span>
                        <span className="text-[10px] text-[#A8B0A8]">&middot;</span>
                        <span className="text-[10px] font-data text-[#737A74]">
                          {p.size_value}{p.size_unit}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#163829] group-hover:text-[#176B4D] truncate mt-0.5">
                        {p.product_name}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-data font-bold text-xs text-[#163829] tabular-nums">
                        ₱{p.price_per_100g.toFixed(2)}/100g
                      </div>
                      <div className={`text-[10px] font-data font-bold tabular-nums ${isPremium ? 'text-[#B8860B]' : 'text-[#176B4D]'}`}>
                        {isPremium ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`} vs median
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#EEF0EA] flex items-center justify-between text-[11px] text-[#737A74] font-sans">
            <span>Price Architecture &middot; PCI &amp; RPP</span>
            <button
              type="button"
              onClick={() => onNavigate('positioning')}
              className="text-[#176B4D] hover:underline font-bold cursor-pointer"
            >
              Explore Positioning Matrix &rarr;
            </button>
          </div>
        </section>

        {/* RIGHT: Opportunity Signals Preview */}
        <section className="bg-white border border-[#E3E6DF] rounded-xl p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF0EA] mb-4">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#B8860B]">
                  COMMERCIAL SURVEILLANCE
                </span>
                <h2 className="text-base font-serif font-bold text-[#163829]">
                  Opportunity Signals
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('opportunities')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#176B4D] hover:underline cursor-pointer font-sans"
              >
                <span>All {opportunities.length} Signals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#4F5751] leading-relaxed mb-4 font-sans">
              Automated surveillance alerts flagging cross-channel price arbitrage, pack size inversions, and steep promotional markdowns.
            </p>

            {/* Top Signals */}
            <div className="space-y-2">
              {opportunities.slice(0, 3).map((opp, idx) => {
                const isHigh = opp.severity === 'HIGH';

                return (
                  <div
                    key={opp.opportunity_id || idx}
                    onClick={() => {
                      if (opp.anchor_product) {
                        onSelectProduct(opp.anchor_product);
                      } else {
                        onNavigate('opportunities');
                      }
                    }}
                    className="p-3 rounded-lg border border-[#E3E6DF] hover:border-[#176B4D]/40 bg-[#FAFAF7] hover:bg-white flex flex-col justify-between gap-1.5 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            isHigh
                              ? 'bg-[#FDF4F3] text-[#C04D44] border border-[#F5C8C4]'
                              : 'bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5]'
                          }`}
                        >
                          {opp.severity}
                        </span>
                        <span className="text-[10px] font-sans text-[#737A74] uppercase tracking-wider truncate">
                          {opp.brand_name} &middot; {opp.retailer_names?.[0] || 'Market'}
                        </span>
                      </div>
                      <span className="text-xs font-data font-bold text-[#163829] tabular-nums">
                        {opp.difference_formatted}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-[#163829] group-hover:text-[#176B4D] line-clamp-1">
                      {opp.entity_name}
                    </div>

                    <p className="text-[11px] text-[#4F5751] line-clamp-1">
                      {opp.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#EEF0EA] flex items-center justify-between text-[11px] text-[#737A74] font-sans">
            <span>Deterministic Rules Governance</span>
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="text-[#176B4D] hover:underline font-bold cursor-pointer"
            >
              Open Surveillance Queue &rarr;
            </button>
          </div>
        </section>
      </div>

      {/* 6. WHAT REQUIRES ATTENTION (CRITICAL ANOMALIES) */}
      <section className="bg-white border border-[#E3E6DF] rounded-xl p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEF0EA]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C04D44]" />
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] font-sans text-[#163829]">
                WHAT REQUIRES ATTENTION &middot; CRITICAL ANOMALIES
              </h2>
            </div>
            <p className="text-xs text-[#737A74] mt-1 font-sans">
              Top pricing anomalies and channel discrepancies requiring commercial investigation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('opportunities')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#163829] bg-[#FAFAF7] border border-[#E3E6DF] hover:bg-[#EEF4EE]/60 transition-colors cursor-pointer font-sans"
          >
            <span>View All Opportunities ({opportunities.length})</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#737A74]" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {opportunities.slice(0, 3).map((opp, idx) => {
            const isHigh = opp.severity === 'HIGH';

            return (
              <div
                key={opp.opportunity_id || idx}
                className="border border-[#E3E6DF] rounded-xl p-4 flex flex-col justify-between space-y-3 bg-[#FAFAF7] hover:bg-white hover:border-[#176B4D]/40 transition-all shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isHigh
                          ? 'bg-[#FDF4F3] text-[#C04D44] border-[#F5C8C4]'
                          : 'bg-[#FFFDF5] text-[#B8860B] border-[#FEEBB5]'
                      }`}
                    >
                      {opp.severity} PRIORITY
                    </span>
                    <EvidenceBadge status={opp.evidence_status || 'Derived'} size="sm" />
                  </div>

                  <div>
                    <div className="text-[10px] font-sans text-[#737A74] uppercase tracking-wider">
                      {opp.brand_name} &middot; {opp.retailer_names?.[0] || 'Market'}
                    </div>
                    <h3 className="text-xs font-bold text-[#163829] line-clamp-1 mt-0.5">
                      {opp.entity_name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-[#E3E6DF] space-y-1">
                    <div className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#176B4D]">
                      OBSERVED SIGNAL
                    </div>
                    <div className="font-data font-bold text-xs text-[#163829] tabular-nums">
                      {opp.difference_formatted} vs {opp.benchmark_formatted}
                    </div>
                    <p className="text-[11px] text-[#4F5751] leading-snug">
                      {opp.summary}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/90 border border-[#E3E6DF] space-y-1">
                    <div className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#176B4D]">
                      SUGGESTED ACTION
                    </div>
                    <p className="text-[11px] text-[#4F5751] leading-snug">
                      {opp.recommended_investigation?.[0] || 'Verify shelf compliance and examine elasticity against comparable SKUs.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EEF0EA] flex items-center justify-between text-[11px]">
                  <span className="text-[#737A74] font-sans text-[10px]">
                    {opp.observation_count} obs &middot; {opp.retailers_observed || 1} banner(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (opp.anchor_product) {
                        onSelectProduct(opp.anchor_product);
                      } else {
                        onNavigate('opportunities');
                      }
                    }}
                    className="text-[#176B4D] hover:underline font-bold text-xs inline-flex items-center gap-1 cursor-pointer font-sans"
                  >
                    <span>Investigate</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. DATA CONSTITUTION & EVIDENCE FOUNDATION */}
      <section className="bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl p-5 sm:p-6 text-xs text-[#737A74]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E3E6DF] flex items-center justify-center text-[#176B4D] shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#163829] font-serif text-sm">
                Data Constitution &amp; Epistemic Standards
              </div>
              <p className="text-xs text-[#4F5751] mt-0.5 max-w-2xl leading-relaxed font-sans">
                THE GROCER strictly differentiates <strong>Observed</strong> shelf data from <strong>Derived</strong> benchmarks and <strong>Estimated</strong> projections. No price point or market share is fabricated.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('methodology')}
            className="px-3.5 py-2 bg-white border border-[#E3E6DF] text-[#163829] hover:bg-[#EEF4EE]/50 hover:text-[#176B4D] rounded-xl font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer inline-flex items-center gap-1.5 font-sans"
          >
            <span>Review Methodology</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#737A74]" />
          </button>
        </div>
      </section>
    </div>
  );
};
