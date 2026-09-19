import React from 'react';
import {
  DollarSign,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Layers,
  Store,
  Tag,
  Info,
  TrendingDown,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import {
  NormalizedProduct,
  MarketSummaryKPIs,
  BrandMetric,
  CrossRetailerSKUComparison,
  TabType
} from '../../types';
import { LearnTooltip } from '../common/LearnTooltip';
import { generateMarketInsights } from '../../utils/calculations';
import { PriceDistributionChart } from '../visualizations/PriceDistributionChart';
import {
  PageHeader,
  KPICard,
  EvidenceBadge,
  MarketContext
} from '../common/DesignSystem';

interface MarketOverviewTabProps {
  products: NormalizedProduct[];
  kpis: MarketSummaryKPIs;
  brandMetrics: BrandMetric[];
  crossRetailer: CrossRetailerSKUComparison[];
  onSelectProduct: (p: NormalizedProduct) => void;
  onNavigate: (tab: TabType) => void;
}

export const MarketOverviewTab: React.FC<MarketOverviewTabProps> = ({
  products,
  kpis,
  brandMetrics,
  crossRetailer,
  onSelectProduct,
  onNavigate
}) => {
  const insights = generateMarketInsights(products, kpis, brandMetrics, crossRetailer);

  // Derive positioning tier distribution from real products
  const tierCounts: Record<string, number> = {};
  products.forEach((p) => {
    const tier = p.positioning_tier || 'Mainstream';
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Market Overview"
        subtitle="Macroeconomic price distribution, category dispersion, and structural positioning across verified Philippine retail shelves."
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="unit_price" label="Normalization" />
            <LearnTooltip topicKey="price_dispersion" label="Dispersion" />
          </div>
        }
      />

      {/* 2. RESTRAINED 6-KPI ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KPICard
          label="MEDIAN UNIT PRICE"
          value={`₱${kpis.medianPricePer100g.toFixed(2)}`}
          unit="/100g"
          evidenceStatus="Derived"
          context="Category Benchmark"
          tooltip="Calculated category median per 100 grams. Resilient against extreme skew."
        />

        <KPICard
          label="MEDIAN SHELF PRICE"
          value={`₱${kpis.medianMarketPrice.toFixed(2)}`}
          unit="PHP"
          evidenceStatus="Observed"
          context="Unadjusted Pack"
          tooltip="Observed median shelf tag price before net-weight normalization."
        />

        <KPICard
          label="LOWEST UNIT COST"
          value={`₱${kpis.lowestUnitPrice?.pricePer100g?.toFixed(2) || '0.00'}`}
          unit="/100g"
          evidenceStatus="Observed"
          context={kpis.lowestUnitPrice?.product?.brand || 'Budget Anchor'}
          tooltip="Most economical observed rate per 100g in the monitored market."
        />

        <KPICard
          label="HIGHEST UNIT COST"
          value={`₱${kpis.highestUnitPrice?.pricePer100g?.toFixed(2) || '0.00'}`}
          unit="/100g"
          evidenceStatus="Observed"
          context={kpis.highestUnitPrice?.product?.brand || 'Premium Line'}
          tooltip="Most expensive therapeutic or imported oral care SKU per 100g."
        />

        <KPICard
          label="PRICE DISPERSION"
          value={`${kpis.coefficientOfVariation}%`}
          unit="CV"
          evidenceStatus="Derived"
          context={`IQR ₱${kpis.iqrPricePer100g.toFixed(2)}`}
          tooltip="Coefficient of variation (σ / μ). High CV reflects significant brand differentiation."
        />

        <KPICard
          label="PROMOTION RATE"
          value={`${kpis.promotionRate}%`}
          unit="Active"
          evidenceStatus="Derived"
          context={`Avg -${kpis.avgDiscountPercent}%`}
          tooltip="Percentage of observed products currently discounted below regular price."
        />
      </div>

      {/* 3. PRICE DISTRIBUTION HISTOGRAM */}
      <PriceDistributionChart
        id="market-overview-price-distribution"
        products={products}
        marketMedian100g={kpis.medianPricePer100g}
        q1Price={kpis.q1PricePer100g}
        q3Price={kpis.q3PricePer100g}
        iqrPrice={kpis.iqrPricePer100g}
        onSelectBin={(bin) => {
          if (bin.products && bin.products.length > 0) {
            onSelectProduct(bin.products[0]);
          }
        }}
      />

      {/* 4. MARKET STRUCTURE & STATISTICAL DISPERSION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Statistical Dispersion & Quartiles */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF0EA] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#163829]">
              Statistical Dispersion
            </h3>
            <EvidenceBadge status="Derived" size="sm" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#EEF0EA]">
              <span className="text-[#737A74]">Sample Mean (μ):</span>
              <span className="font-bold font-data tabular-nums text-[#163829]">₱{kpis.meanPricePer100g.toFixed(2)} /100g</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#EEF0EA]">
              <span className="text-[#737A74]">Sample Median (Q2):</span>
              <span className="font-bold font-data tabular-nums text-[#176B4D]">₱{kpis.medianPricePer100g.toFixed(2)} /100g</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#EEF0EA]">
              <span className="text-[#737A74]">1st Quartile (Q1 - 25%):</span>
              <span className="font-data tabular-nums text-[#163829]">₱{kpis.q1PricePer100g.toFixed(2)} /100g</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#EEF0EA]">
              <span className="text-[#737A74]">3rd Quartile (Q3 - 75%):</span>
              <span className="font-data tabular-nums text-[#163829]">₱{kpis.q3PricePer100g.toFixed(2)} /100g</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#EEF0EA]">
              <span className="text-[#737A74]">Interquartile Range (IQR):</span>
              <span className="font-data tabular-nums text-[#163829]">₱{kpis.iqrPricePer100g.toFixed(2)} /100g</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#EEF0EA]">
              <span className="text-[#737A74]">Standard Deviation (σ):</span>
              <span className="font-data tabular-nums text-[#163829]">₱{kpis.stdDevPricePer100g.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 bg-[#EEF4EE] border border-[#DDEBE1] px-2.5 rounded-lg mt-2">
              <span className="text-[#176B4D] font-semibold">Coefficient of Variation:</span>
              <span className="font-bold font-data tabular-nums text-[#176B4D]">{kpis.coefficientOfVariation}%</span>
            </div>
          </div>

          <p className="text-[11px] text-[#737A74] leading-relaxed pt-1">
            <strong>Methodology Note:</strong> High dispersion is driven by therapeutic specialty premiums (e.g. potassium nitrate desensitizing formulations) versus mass volume standard sodium fluoride SKUs.
          </p>
        </div>

        {/* Market Structure Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF0EA] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#163829]">
              Market Structure Breakdown
            </h3>
            <EvidenceBadge status="Observed" size="sm" />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[11px] text-[#737A74] uppercase tracking-wider mb-2 font-semibold">
                Positioning Tiers
              </div>
              <div className="space-y-1.5">
                {Object.entries(tierCounts).map(([tier, count]) => {
                  const pct = ((count / products.length) * 100).toFixed(0);
                  return (
                    <div key={tier} className="flex items-center justify-between text-xs p-1.5 rounded-md hover:bg-[#FAFAF7] transition-colors">
                      <span className="text-[#163829] font-medium">{tier}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-data tabular-nums text-[#737A74]">{count} SKUs</span>
                        <span className="font-data tabular-nums text-[10px] bg-[#FAFAF7] border border-[#E3E6DF] px-1.5 py-0.5 rounded text-[#4F5751]">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[#EEF0EA]">
              <div className="text-[11px] text-[#737A74] uppercase tracking-wider mb-2 font-semibold">
                Channels Audited
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF]">
                  <div className="font-bold text-[#163829]">Modern Trade</div>
                  <div className="text-[11px] text-[#737A74]">SM &middot; Puregold</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF]">
                  <div className="font-bold text-[#163829]">Pharmacy</div>
                  <div className="text-[11px] text-[#737A74]">Mercury &middot; Watsons</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Automated Market Findings ("What the Data Show") */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF0EA] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#163829] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#176B4D]" />
              <span>Observed Market Findings</span>
            </h3>
            <EvidenceBadge status="Derived" size="sm" />
          </div>

          <div className="space-y-2.5">
            {insights.slice(0, 3).map((insight, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF] text-xs text-[#163829] leading-snug flex items-start gap-2.5"
              >
                <span className="w-4 h-4 rounded-full bg-[#EEF4EE] border border-[#DDEBE1] text-[#176B4D] font-data font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p>{insight}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#737A74]">
            <button
              type="button"
              onClick={() => onNavigate('competitive')}
              className="text-[#176B4D] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Competitive Landscape &rarr;</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('economics')}
              className="text-[#737A74] hover:text-[#163829] text-[11px] cursor-pointer"
            >
              Econometric View &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
