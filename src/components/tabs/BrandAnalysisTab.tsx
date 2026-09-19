import React, { useState, useMemo } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldCheck,
  Star,
  Package,
  AlertTriangle,
  BarChart3,
  Store,
  Tag,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { BrandMetric, NormalizedProduct, PositioningTier } from '../../types';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';

interface BrandAnalysisTabProps {
  brandMetrics: BrandMetric[];
  marketMedian100g: number;
  products: NormalizedProduct[];
  onSelectProduct: (p: NormalizedProduct) => void;
}

export const BrandAnalysisTab: React.FC<BrandAnalysisTabProps> = ({
  brandMetrics,
  marketMedian100g,
  products,
  onSelectProduct
}) => {
  // Default to the first brand or the brand with the most products
  const defaultBrand = useMemo(() => {
    if (brandMetrics.length === 0) return '';
    return [...brandMetrics].sort((a, b) => b.productCount - a.productCount)[0]?.brand || brandMetrics[0].brand;
  }, [brandMetrics]);

  const [selectedBrand, setSelectedBrand] = useState<string>(defaultBrand);

  const currentBrand = selectedBrand || defaultBrand;

  // Filter products for the active brand
  const brandProducts = useMemo(() => {
    return products.filter((p) => p.brand.toLowerCase() === currentBrand.toLowerCase());
  }, [products, currentBrand]);

  // Current brand metric
  const currentMetric = useMemo(() => {
    return brandMetrics.find((b) => b.brand.toLowerCase() === currentBrand.toLowerCase()) || brandMetrics[0];
  }, [brandMetrics, currentBrand]);

  // Calculations for the Selected Brand Hero
  const heroStats = useMemo(() => {
    if (brandProducts.length === 0) {
      return {
        skuCount: 0,
        avgUnitPrice: 0,
        medianUnitPrice: currentMetric?.medianPricePer100g || 0,
        minPricePer100g: 0,
        maxPricePer100g: 0,
        retailers: [] as string[]
      };
    }

    const prices = brandProducts.map((p) => p.price_per_100g).sort((a, b) => a - b);
    const sum = prices.reduce((acc, v) => acc + v, 0);
    const avg = sum / prices.length;
    const median = prices[Math.floor(prices.length / 2)];
    const retailers = Array.from(new Set(brandProducts.map((p) => p.retailer)));

    return {
      skuCount: brandProducts.length,
      avgUnitPrice: avg,
      medianUnitPrice: median,
      minPricePer100g: prices[0],
      maxPricePer100g: prices[prices.length - 1],
      retailers
    };
  }, [brandProducts, currentMetric]);

  // Tier distribution for Brand Pricing Architecture
  const tierDistribution = useMemo(() => {
    const counts: Record<PositioningTier, number> = {
      Budget: 0,
      Mainstream: 0,
      Premium: 0,
      Specialty: 0,
      Unknown: 0
    };

    brandProducts.forEach((p) => {
      if (counts[p.premium_positioning] !== undefined) {
        counts[p.premium_positioning] += 1;
      } else {
        counts.Mainstream += 1;
      }
    });

    const total = brandProducts.length || 1;

    return (['Budget', 'Mainstream', 'Premium', 'Specialty'] as PositioningTier[]).map((tier) => ({
      tier,
      count: counts[tier],
      percentage: (counts[tier] / total) * 100
    }));
  }, [brandProducts]);

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Brand Analysis"
        subtitle={`Standardized portfolio breakdown, SKU dispersion, and tier positioning against market median (₱${(marketMedian100g ?? 0).toFixed(2)}/100g).`}
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="brand_premium" label="Learn Brand Premium" />
            <EvidenceBadge status="Derived" size="md" />
          </div>
        }
      />

      {/* 2. METHODOLOGICAL CAUTION */}
      <div className="bg-[#FFFDF5] border border-[#FEEBB5] rounded-xl p-4 text-xs text-[#4F5751] flex items-start gap-3 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
        <div className="space-y-0.5 font-sans">
          <div className="font-bold text-[#163829] uppercase tracking-wider text-[10px]">
            Methodological Notice: Brand Presence vs Revenue Share
          </div>
          <p className="leading-relaxed">
            Market revenue share is <strong>not observable</strong> from shelf audits alone. True Herfindahl-Hirschman Index (HHI) cannot be computed.
            We compute a verifiable <strong>Brand Presence Share</strong> based on audited SKU counts and retail banner distributions.
          </p>
        </div>
      </div>

      {/* 3. BRAND SELECTOR PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-sans">
        <span className="text-xs font-bold uppercase tracking-wider text-[#737A74] shrink-0 mr-1">
          Select Brand:
        </span>
        {brandMetrics.map((b) => {
          const isActive = b.brand.toLowerCase() === currentBrand.toLowerCase();
          return (
            <button
              key={b.brand}
              onClick={() => setSelectedBrand(b.brand)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#176B4D] text-white shadow-xs'
                  : 'bg-white border border-[#E3E6DF] text-[#4F5751] hover:bg-[#FAFAF7] hover:text-[#163829]'
              }`}
            >
              <span>{b.brand}</span>
              <span className={`ml-1.5 text-[10px] font-data font-semibold tabular-nums ${isActive ? 'text-[#DDEBE1]' : 'text-[#737A74]'}`}>
                ({b.productCount})
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. SELECTED BRAND HERO */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EEF0EA]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-serif font-extrabold text-[#163829] tracking-tight">
                {currentBrand}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#EEF4EE] border border-[#DDEBE1] text-[#176B4D] font-sans text-[10px] font-bold uppercase tracking-wide">
                {currentMetric?.primaryTier || 'Mainstream'} Tier
              </span>
            </div>
            <p className="text-xs text-[#737A74] mt-1 font-sans">
              Observed across {heroStats.retailers.length} major Philippine supermarket banners ({heroStats.retailers.join(', ')}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans px-2.5 py-1 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF] text-[#163829]">
              Catalog Share: <strong className="font-data font-bold">{currentMetric?.presenceShare}%</strong>
            </span>
          </div>
        </div>

        {/* Hero Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-left">
          <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF] space-y-0.5">
            <div className="text-[10px] font-sans uppercase tracking-wider text-[#737A74] font-bold">Observed SKUs</div>
            <div className="text-xl font-bold font-data tabular-nums text-[#163829]">{heroStats.skuCount}</div>
            <div className="text-[10px] text-[#737A74] font-sans">Audited line items</div>
          </div>

          <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF] space-y-0.5">
            <div className="text-[10px] font-sans uppercase tracking-wider text-[#737A74] font-bold">Average Unit Price</div>
            <div className="text-xl font-bold font-data tabular-nums text-[#163829]">
              ₱{heroStats.avgUnitPrice.toFixed(2)}
              <span className="text-xs font-normal text-[#737A74] font-sans">/100g</span>
            </div>
            <div className="text-[10px] text-[#737A74] font-sans">Mean standardized</div>
          </div>

          <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF] space-y-0.5">
            <div className="text-[10px] font-sans uppercase tracking-wider text-[#737A74] font-bold">Median Unit Price</div>
            <div className="text-xl font-bold font-data tabular-nums text-[#176B4D]">
              ₱{heroStats.medianUnitPrice.toFixed(2)}
              <span className="text-xs font-normal text-[#737A74] font-sans">/100g</span>
            </div>
            <div className="text-[10px] text-[#737A74] font-sans">50th percentile</div>
          </div>

          <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF] space-y-0.5">
            <div className="text-[10px] font-sans uppercase tracking-wider text-[#737A74] font-bold">Price Spread</div>
            <div className="text-base font-bold font-data tabular-nums text-[#163829] mt-0.5">
              ₱{heroStats.minPricePer100g.toFixed(2)} &ndash; ₱{heroStats.maxPricePer100g.toFixed(2)}
            </div>
            <div className="text-[10px] text-[#737A74] font-sans">Min to Max unit range</div>
          </div>

          <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF] space-y-0.5">
            <div className="text-[10px] font-sans uppercase tracking-wider text-[#737A74] font-bold">vs Market Median</div>
            <div
              className={`text-xl font-bold font-data tabular-nums ${
                (currentMetric?.marketPremiumPercent || 0) >= 0 ? 'text-[#B45309]' : 'text-[#176B4D]'
              }`}
            >
              {(currentMetric?.marketPremiumPercent || 0) >= 0 ? `+${currentMetric?.marketPremiumPercent}%` : `${currentMetric?.marketPremiumPercent}%`}
            </div>
            <div className="text-[10px] text-[#737A74] font-sans">Relative price premium</div>
          </div>
        </div>
      </div>

      {/* 5. BRAND SKU PORTFOLIO TABLE */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] overflow-hidden shadow-card">
        <div className="p-4 sm:p-5 border-b border-[#E3E6DF] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] font-sans text-[#163829]">
              {currentBrand} SKU Portfolio Matrix
            </h3>
            <p className="text-xs text-[#737A74] mt-0.5 font-sans">
              Granular surveillance of {brandProducts.length} observed SKUs with internal and category-level price distance metrics.
            </p>
          </div>
          <span className="text-xs text-[#737A74] font-sans">
            Market Baseline: <strong className="font-data tabular-nums text-[#163829]">₱{marketMedian100g.toFixed(2)}/100g</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#737A74] font-sans uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-semibold">SKU Name</th>
                <th className="py-2.5 px-3 font-semibold">Size</th>
                <th className="py-2.5 px-3 font-semibold">Retailer</th>
                <th className="py-2.5 px-3 text-right font-semibold">Observed Shelf</th>
                <th className="py-2.5 px-3 text-right font-semibold">Unit Price</th>
                <th className="py-2.5 px-3 text-right font-semibold">vs Brand Median</th>
                <th className="py-2.5 px-3 text-right font-semibold">vs Market Median</th>
                <th className="py-2.5 px-3 text-center font-semibold">Active Promo</th>
                <th className="py-2.5 px-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF0EA]">
              {brandProducts.map((p) => {
                const vsBrandMedian = heroStats.medianUnitPrice > 0
                  ? ((p.price_per_100g - heroStats.medianUnitPrice) / heroStats.medianUnitPrice) * 100
                  : 0;
                const vsMarketMedian = marketMedian100g > 0
                  ? ((p.price_per_100g - marketMedian100g) / marketMedian100g) * 100
                  : 0;

                return (
                  <tr key={p.product_id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div
                        className="font-bold text-[#163829] hover:text-[#176B4D] cursor-pointer truncate font-sans"
                        onClick={() => onSelectProduct(p)}
                      >
                        {p.product_name}
                      </div>
                      <div className="text-[10px] text-[#737A74] font-sans mt-0.5">
                        {p.variant} &middot; {p.premium_positioning}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-data text-[#737A74]">
                      {p.size_value}{p.size_unit}
                      {p.is_multipack && <span className="block text-[10px] text-[#B45309] font-sans">Multipack</span>}
                    </td>

                    <td className="py-3 px-3 text-[#737A74] font-sans">
                      {p.retailer}
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums font-bold text-[#163829]">
                      ₱{p.price_php.toFixed(2)}
                      {p.regular_price_php && p.regular_price_php > p.price_php && (
                        <div className="text-[10px] line-through text-[#9CA3AF] font-normal font-data">
                          ₱{p.regular_price_php.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums font-bold text-[#176B4D]">
                      ₱{p.price_per_100g.toFixed(2)}/100g
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums font-semibold">
                      <span className={vsBrandMedian > 0 ? 'text-[#B45309]' : 'text-[#176B4D]'}>
                        {vsBrandMedian > 0 ? `+${vsBrandMedian.toFixed(1)}%` : `${vsBrandMedian.toFixed(1)}%`}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums font-semibold">
                      <span className={vsMarketMedian > 0 ? 'text-[#B45309]' : 'text-[#176B4D]'}>
                        {vsMarketMedian > 0 ? `+${vsMarketMedian.toFixed(1)}%` : `${vsMarketMedian.toFixed(1)}%`}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {p.discount_percent > 0 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FFFDF5] border border-[#FEEBB5] text-[#B8860B] text-[10px] font-semibold font-data">
                          <Tag className="w-3 h-3" />
                          -{p.discount_percent.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF] text-[11px] font-sans">Regular</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(p)}
                        className="text-[11px] font-semibold text-[#176B4D] hover:underline cursor-pointer font-sans"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. BRAND PRICING ARCHITECTURE VISUAL */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] p-6 shadow-card space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] font-sans text-[#163829] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#176B4D]" />
            <span>Brand Pricing Architecture &middot; Tier Density Distribution</span>
          </h3>
          <p className="text-xs text-[#737A74] mt-0.5 font-sans">
            Distribution of {currentBrand} observed SKUs across standardized retail positioning tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-sans">
          {tierDistribution.map((t) => (
            <div key={t.tier} className="p-4 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#163829]">{t.tier}</span>
                <span className="text-[11px] font-data tabular-nums font-bold text-[#176B4D]">
                  {t.percentage.toFixed(0)}%
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-[#E3E6DF] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#176B4D] h-full rounded-full transition-all duration-300"
                  style={{ width: `${t.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#737A74]">
                <span className="font-data tabular-nums">{t.count} observed SKUs</span>
                <span>{t.count > 0 ? 'Active' : 'No SKUs'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
