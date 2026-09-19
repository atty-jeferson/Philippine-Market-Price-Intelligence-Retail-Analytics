import React, { useState, useMemo } from 'react';
import {
  Building2,
  Layers,
  ArrowUpDown,
  Tag,
  Info,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Eye,
  SlidersHorizontal,
  Scale,
  Award
} from 'lucide-react';
import { NormalizedProduct } from '../../types';
import {
  BrandPricePortfolio,
  calculateBrandPriceArchitecture,
  calculatePriceWaterfall,
  PriceWaterfall
} from '../../domain/priceArchitecture';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';

interface BrandPriceArchitectureTabProps {
  products: NormalizedProduct[];
  marketMedian100g: number;
  onSelectProduct: (p: NormalizedProduct) => void;
}

export const BrandPriceArchitectureTab: React.FC<BrandPriceArchitectureTabProps> = ({
  products,
  marketMedian100g,
  onSelectProduct
}) => {
  const brands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand))).sort();
  }, [products]);

  const [selectedBrand, setSelectedBrand] = useState<string>(brands[0] || 'Colgate');
  const [selectedWaterfallSku, setSelectedWaterfallSku] = useState<NormalizedProduct | null>(null);

  const portfolio: BrandPricePortfolio | null = useMemo(() => {
    return calculateBrandPriceArchitecture(selectedBrand, products, marketMedian100g);
  }, [selectedBrand, products, marketMedian100g]);

  const waterfall: PriceWaterfall | null = useMemo(() => {
    if (!selectedWaterfallSku) return null;
    return calculatePriceWaterfall(selectedWaterfallSku, products, marketMedian100g);
  }, [selectedWaterfallSku, products, marketMedian100g]);

  if (!portfolio) {
    return (
      <div className="p-8 text-center text-[#6B7280]">
        No portfolio data available for brand {selectedBrand}.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Brand Price Architecture"
        subtitle="Hierarchical decomposition of brand portfolio tiers, pack-size progressions, and price waterfall drivers."
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="brand_premium" label="Price Architecture Concepts" />
            <EvidenceBadge status="Derived" size="md" />
          </div>
        }
      />

      {/* 2. BRAND SELECTOR RIBBON */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] p-4 flex flex-wrap items-center justify-between gap-4 shadow-card font-sans">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-bold text-[#737A74]">Select Brand:</span>
          <div className="flex flex-wrap gap-1.5">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setSelectedBrand(b);
                  setSelectedWaterfallSku(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedBrand.toLowerCase() === b.toLowerCase()
                    ? 'bg-[#176B4D] text-white shadow-xs'
                    : 'bg-[#FAFAF7] border border-[#E3E6DF] text-[#4F5751] hover:text-[#163829] hover:bg-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#737A74]">
          <strong className="text-[#163829] font-bold font-data">{portfolio.sku_count}</strong> SKUs in catalog
        </div>
      </div>

      {/* 3. EXECUTIVE PORTFOLIO METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-sans">
        <KPICard
          label="Entry-Level SKU"
          value={`₱${portfolio.lowest_priced_sku.price_php.toFixed(2)}`}
          subtext={portfolio.lowest_priced_sku.name}
          badge={{ text: `₱${portfolio.lowest_priced_sku.price_per_100g.toFixed(2)}/100g`, variant: 'neutral' }}
        />

        <KPICard
          label="Median Shelf Price"
          value={`₱${portfolio.median_shelf_price.toFixed(2)}`}
          subtext="Across observed formats"
          badge={{ text: `Range: ₱${portfolio.price_range_php.toFixed(2)}`, variant: 'neutral' }}
        />

        <KPICard
          label="Brand Portfolio Median"
          value={`₱${portfolio.median_unit_price.toFixed(2)}`}
          unit="/100g"
          subtext="Standardized baseline"
          badge={{ text: `Mean: ₱${portfolio.mean_unit_price.toFixed(2)}`, variant: 'positive' }}
        />

        <KPICard
          label="Market Premium"
          value={portfolio.premium_vs_market_percent > 0 ? `+${portfolio.premium_vs_market_percent}%` : `${portfolio.premium_vs_market_percent}%`}
          subtext={`vs Market (₱${marketMedian100g.toFixed(2)}/100g)`}
          badge={{ text: "Relative Power", variant: portfolio.premium_vs_market_percent > 0 ? 'warning' : 'positive' }}
        />

        <KPICard
          label="Flagship Tier SKU"
          value={`₱${portfolio.highest_priced_sku.price_php.toFixed(2)}`}
          subtext={portfolio.highest_priced_sku.name}
          badge={{ text: `₱${portfolio.highest_priced_sku.price_per_100g.toFixed(2)}/100g`, variant: 'neutral' }}
        />
      </div>

      {/* 4. METHODOLOGICAL CLARITY CALLOUT */}
      <div className="bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl p-4 text-xs text-[#4F5751] flex items-start gap-3 shadow-2xs font-sans">
        <Info className="w-4 h-4 text-[#176B4D] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold uppercase tracking-wider text-[10px] text-[#163829]">
            Three Distinct Pricing Benchmarks
          </div>
          <p>
            In category management, a product&apos;s price position must be interpreted against three separate references:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-white p-3 rounded-lg border border-[#E3E6DF]">
              <strong className="text-[#163829] block text-[11px]">1. vs Market Median:</strong>
              How the SKU compares against the entire category aggregate (<span className="font-data">₱{marketMedian100g.toFixed(2)}</span>/100g).
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#E3E6DF]">
              <strong className="text-[#163829] block text-[11px]">2. vs Brand Portfolio Median:</strong>
              How the SKU is tiered inside {selectedBrand}&apos;s internal line-up (<span className="font-data">₱{portfolio.median_unit_price.toFixed(2)}</span>/100g).
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#E3E6DF]">
              <strong className="text-[#163829] block text-[11px]">3. vs Comp Set Median:</strong>
              How the SKU compares strictly against its direct formula variant and pack-size peer cluster.
            </div>
          </div>
        </div>
      </div>

      {/* 5. BRAND PORTFOLIO TABLE */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] overflow-hidden shadow-card font-sans">
        <div className="p-4 sm:p-5 border-b border-[#E3E6DF] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#163829]">
              {selectedBrand} Portfolio Hierarchy Matrix
            </h3>
            <p className="text-xs text-[#737A74] mt-0.5">Sorted by packaging volume and unit cost tier</p>
          </div>
          <span className="text-xs text-[#737A74] hidden sm:inline">
            Click &ldquo;Price Waterfall&rdquo; to see step-by-step price decomposition
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#737A74] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-semibold">SKU / Variant</th>
                <th className="py-2.5 px-2 font-semibold">Size</th>
                <th className="py-2.5 px-3 font-semibold">Positioning</th>
                <th className="py-2.5 px-3 text-right font-semibold">Observed Shelf</th>
                <th className="py-2.5 px-3 text-right font-semibold">Unit (₱/100g)</th>
                <th className="py-2.5 px-3 text-right font-semibold">vs Market</th>
                <th className="py-2.5 px-3 text-right font-semibold">vs Brand</th>
                <th className="py-2.5 px-3 text-right font-semibold">vs Comp Set</th>
                <th className="py-2.5 px-3 text-center font-semibold">Retailers</th>
                <th className="py-2.5 px-4 text-center font-semibold">Decomposition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF0EA]">
              {portfolio.skus.map((sku) => {
                const isInspecting = selectedWaterfallSku?.product_id === sku.product_id;
                return (
                  <tr
                    key={sku.product_id}
                    className={`hover:bg-[#FAFAF7] transition-colors ${
                      isInspecting ? 'bg-[#EEF4EE]/70' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div
                        className="font-bold text-[#163829] hover:text-[#176B4D] cursor-pointer truncate max-w-xs"
                        onClick={() => onSelectProduct(sku.normalized_product)}
                      >
                        {sku.product_name}
                      </div>
                      <div className="text-[10px] text-[#737A74] mt-0.5">
                        Variant: {sku.variant}
                      </div>
                    </td>

                    <td className="py-3 px-2 font-data text-[#163829]">
                      {sku.size_value}{sku.size_unit}
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FAFAF7] border border-[#E3E6DF] text-[#4F5751]">
                        {sku.positioning_tier}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums font-bold text-[#163829]">
                      ₱{sku.observed_shelf_price.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums font-bold text-[#176B4D]">
                      ₱{sku.price_per_100g.toFixed(2)}
                    </td>

                    {/* 1. vs Market Median */}
                    <td className="py-3 px-3 text-right font-data tabular-nums font-semibold">
                      <span className={sku.premium_vs_market_percent > 0 ? 'text-[#B45309]' : 'text-[#176B4D]'}>
                        {sku.premium_vs_market_percent > 0 ? `+${sku.premium_vs_market_percent}%` : `${sku.premium_vs_market_percent}%`}
                      </span>
                    </td>

                    {/* 2. vs Brand Portfolio Median */}
                    <td className="py-3 px-3 text-right font-data tabular-nums font-semibold">
                      <span className={sku.premium_vs_brand_median_percent > 0 ? 'text-[#B45309]' : 'text-[#176B4D]'}>
                        {sku.premium_vs_brand_median_percent > 0 ? `+${sku.premium_vs_brand_median_percent}%` : `${sku.premium_vs_brand_median_percent}%`}
                      </span>
                    </td>

                    {/* 3. vs Comp Set Median */}
                    <td className="py-3 px-3 text-right font-data tabular-nums font-semibold">
                      <span className={sku.premium_vs_comp_set_percent > 0 ? 'text-[#B45309]' : 'text-[#176B4D]'}>
                        {sku.premium_vs_comp_set_percent > 0 ? `+${sku.premium_vs_comp_set_percent}%` : `${sku.premium_vs_comp_set_percent}%`}
                      </span>
                    </td>

                    {/* Cross-Retailer Count */}
                    <td className="py-3 px-3 text-center text-[11px] text-[#737A74]">
                      <span className="font-data">{sku.retailer_count}</span> {sku.retailer_count === 1 ? 'banner' : 'banners'}
                      {sku.retailer_price_range.spread_percent > 0 && (
                        <div className="text-[10px] text-[#737A74] font-data">
                          (&plusmn;{sku.retailer_price_range.spread_percent}%)
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedWaterfallSku(isInspecting ? null : sku.normalized_product)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          isInspecting
                            ? 'bg-[#176B4D] text-white shadow-xs'
                            : 'bg-[#FAFAF7] border border-[#E3E6DF] text-[#163829] hover:bg-white'
                        }`}
                      >
                        <Layers className="w-3 h-3 text-[#176B4D]" />
                        <span>{isInspecting ? 'Hide Waterfall' : 'Price Waterfall'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. EMBEDDED WATERFALL VIEWER */}
      {selectedWaterfallSku && waterfall && (
        <div className="bg-white rounded-xl border-2 border-[#176B4D] p-6 space-y-4 shadow-card font-sans">
          <div className="flex items-center justify-between border-b border-[#EEF0EA] pb-3">
            <div>
              <div className="text-[10px] text-[#176B4D] font-bold uppercase tracking-wider">
                Descriptive Price Decomposition for Selected SKU
              </div>
              <h3 className="text-base font-serif font-extrabold text-[#163829] mt-0.5">
                {selectedWaterfallSku.product_name}
              </h3>
              <p className="text-xs text-[#737A74]">
                Observed at {selectedWaterfallSku.retailer} (Shelf Price: <span className="font-data font-bold">₱{selectedWaterfallSku.price_php.toFixed(2)}</span>, Unit Price: <span className="font-data font-bold">₱{selectedWaterfallSku.price_per_100g.toFixed(2)}</span>/100g)
              </p>
            </div>
            <button
              onClick={() => setSelectedWaterfallSku(null)}
              className="text-xs text-[#737A74] hover:text-[#163829] font-semibold cursor-pointer"
            >
              Close Decomposition
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {waterfall.steps.map((s, i) => (
              <div key={s.step_id} className="bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl p-3.5 space-y-1">
                <div className="text-[10px] text-[#737A74] uppercase font-bold">Step 0{i + 1}</div>
                <div className="text-xs font-bold text-[#163829] truncate">{s.label}</div>
                <div className={`text-base font-bold font-data tabular-nums ${
                  s.category === 'final_price'
                    ? 'text-[#176B4D]'
                    : s.value_php < 0
                    ? 'text-[#176B4D]'
                    : 'text-[#B45309]'
                }`}>
                  {s.category !== 'final_price' && s.category !== 'benchmark' && s.value_php > 0 ? '+' : ''}
                  ₱{s.value_php.toFixed(2)}
                </div>
                <div className="text-[10px] text-[#737A74] truncate" title={s.formula}>
                  {s.formula}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
