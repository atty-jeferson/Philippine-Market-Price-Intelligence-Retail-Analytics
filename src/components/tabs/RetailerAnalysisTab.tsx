import React, { useState } from 'react';
import {
  Store,
  ArrowRight,
  TrendingDown,
  Info,
  ShieldCheck,
  Tag,
  AlertCircle,
  Search,
  CheckCircle2
} from 'lucide-react';
import {
  RetailerMetric,
  CrossRetailerSKUComparison,
  NormalizedProduct
} from '../../types';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';
import { RetailerComparisonChart } from '../visualizations/RetailerComparisonChart';

interface RetailerAnalysisTabProps {
  retailerMetrics: RetailerMetric[];
  crossRetailerSKUs: CrossRetailerSKUComparison[];
  marketMedian100g: number;
  products: NormalizedProduct[];
  onSelectProduct: (p: NormalizedProduct) => void;
}

export const RetailerAnalysisTab: React.FC<RetailerAnalysisTabProps> = ({
  retailerMetrics,
  crossRetailerSKUs,
  marketMedian100g,
  products,
  onSelectProduct
}) => {
  const [selectedSKUIndex, setSelectedSKUIndex] = useState<number>(0);
  const activeSKU = crossRetailerSKUs[selectedSKUIndex] || crossRetailerSKUs[0];

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Retailer Analysis"
        subtitle="Audited cross-channel price dispersion for identical SKUs, banner price index benchmarks, and promotional depth."
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="price_dispersion" label="Learn Price Dispersion" />
            <EvidenceBadge status="Observed" size="md" />
          </div>
        }
      />

      {/* 2. IDENTICAL SKU CROSS-RETAILER DISPERSION SPOTLIGHT */}
      <div className="bg-white p-6 rounded-xl border border-[#E8E9EC] shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
          <div>
            <div className="text-[10px] font-bold font-sans text-[#0F5132] uppercase tracking-wider">
              Identical SKU Price Dispersion Surveillance
            </div>
            <h3 className="text-xl font-bold text-[#111318] mt-0.5 tracking-tight font-sans">
              {activeSKU?.canonicalName} ({activeSKU?.size})
            </h3>
            <p className="text-xs text-[#6B7280] font-sans">
              Matched strictly on identical brand, formula variant, and net weight across Philippine supermarket chains.
            </p>
          </div>

          {/* Selector for which identical SKU to inspect */}
          {crossRetailerSKUs.length > 1 && (
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-sans uppercase tracking-wider text-[#6B7280] font-bold mb-1">
                Select Identical SKU:
              </label>
              <select
                id="sku-dispersion-select"
                value={selectedSKUIndex}
                onChange={(e) => setSelectedSKUIndex(parseInt(e.target.value))}
                className="py-1.5 px-3 bg-[#F8F9FB] border border-[#E8E9EC] rounded-lg text-xs text-[#111318] font-sans focus:outline-none focus:border-[#0F5132]"
              >
                {crossRetailerSKUs.map((sku, idx) => (
                  <option key={idx} value={idx} className="bg-white text-[#111318]">
                    {sku.brand} &ndash; {sku.canonicalName} ({sku.size})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeSKU ? (
          <div className="space-y-5">
            {/* Highlights of Price Gap */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl space-y-1 font-sans">
                <div className="text-[10px] uppercase tracking-wider text-[#0F5132] font-bold">Lowest Shelf Price</div>
                <div className="text-sm font-bold text-[#111318] truncate">
                  {activeSKU.cheapestRetailer}
                </div>
                <div className="text-xl font-data tabular-nums font-bold text-[#0F5132]">
                  ₱{activeSKU.minPrice.toFixed(2)}
                </div>
              </div>

              <div className="p-3.5 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl space-y-1 font-sans">
                <div className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold">Highest Shelf Price</div>
                <div className="text-sm font-bold text-[#111318] truncate">
                  {activeSKU.priciestRetailer}
                </div>
                <div className="text-xl font-data tabular-nums font-bold text-[#111318]">
                  ₱{activeSKU.maxPrice.toFixed(2)}
                </div>
              </div>

              <div className="p-3.5 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl space-y-1 font-sans">
                <div className="text-[10px] uppercase tracking-wider text-[#111318] font-bold">Absolute Price Spread</div>
                <div className="text-xl font-data tabular-nums font-bold text-[#111318]">
                  ₱{activeSKU.absoluteGap.toFixed(2)}
                </div>
                <div className="text-[10px] text-[#6B7280]">Direct savings per basket unit</div>
              </div>

              <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl space-y-1 font-sans">
                <div className="text-[10px] uppercase tracking-wider text-[#B45309] font-bold">Dispersion Percentage</div>
                <div className="text-xl font-data tabular-nums font-bold text-[#B45309]">
                  {activeSKU.percentageGap}%
                </div>
                <div className="text-[10px] text-[#6B7280]">Cross-channel arbitrage spread</div>
              </div>
            </div>

            {/* Cross Retailer Price List for this SKU */}
            <div className="border border-[#E8E9EC] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left border-collapse font-sans">
                <thead className="bg-[#F8F9FB] border-b border-[#E8E9EC] text-[#6B7280] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Retailer Banner</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Observed Shelf Price</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Normalized Unit (₱/100g)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Promotional Status</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Delta vs Lowest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[#111318]">
                  {activeSKU.retailers
                    .sort((a, b) => a.price - b.price)
                    .map((r, i) => {
                      const delta = r.price - activeSKU.minPrice;
                      const deltaPct = activeSKU.minPrice > 0 ? (delta / activeSKU.minPrice) * 100 : 0;
                      return (
                        <tr key={i} className={i === 0 ? 'bg-[#F0FDF4]/50' : 'hover:bg-[#F8F9FB] transition-colors'}>
                          <td className="py-3 px-4 flex items-center gap-2">
                            <span className="font-bold text-[#111318]">{r.retailer}</span>
                            {i === 0 && (
                              <span className="text-[10px] font-sans font-bold bg-[#F0FDF4] text-[#0F5132] border border-[#DCFCE7] px-1.5 py-0.2 rounded-md">
                                Best Price
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-data tabular-nums font-bold text-[#111318]">
                            ₱{r.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right text-[#6B7280] font-data tabular-nums font-semibold">
                            ₱{r.pricePer100g.toFixed(2)}/100g
                          </td>
                          <td className="py-3 px-3 text-right">
                            {r.isOnSale ? (
                              <span className="text-[#B45309] font-data font-bold bg-[#FFFBEB] px-1.5 py-0.5 rounded-md border border-[#FDE68A] text-[10px]">
                                -{r.discountPercent}% Promo
                              </span>
                            ) : (
                              <span className="text-[#9CA3AF] text-[11px] font-sans">Regular</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-data tabular-nums">
                            {delta === 0 ? (
                              <span className="text-[#0F5132] font-bold font-sans">Baseline (0%)</span>
                            ) : (
                              <span className="text-[#B45309] font-semibold">
                                +₱{delta.toFixed(2)} (+{deltaPct.toFixed(1)}%)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#6B7280]">No cross-retailer observations matched.</p>
        )}
      </div>

      {/* 3. RETAILER PRICE COMPARISON CHART */}
      <RetailerComparisonChart
        id="retailer-comparison-viz"
        metrics={retailerMetrics}
        marketMedian100g={marketMedian100g}
      />

      {/* 4. AGGREGATE RETAILER METRICS TABLE */}
      <div className="bg-white p-6 rounded-xl border border-[#E8E9EC] shadow-card space-y-4 font-sans">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#111318]">
            Audited Philippine Retailer Price Indexes
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Overall price level index by retailer channel (100 = Market Median ₱{marketMedian100g.toFixed(2)}/100g)
          </p>
        </div>

        <div className="border border-[#E8E9EC] rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#F8F9FB] border-b border-[#E8E9EC] text-[#6B7280] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Retailer Banner</th>
                <th className="py-3 px-3 font-semibold">Channel Type</th>
                <th className="py-3 px-3 text-center font-semibold">Observed SKUs</th>
                <th className="py-3 px-3 text-right font-semibold">Median Unit Price</th>
                <th className="py-3 px-3 text-right font-semibold">Retailer Price Index</th>
                <th className="py-3 px-3 text-right font-semibold">Active Promos</th>
                <th className="py-3 px-4 text-right font-semibold">Avg Promo Depth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#111318]">
              {retailerMetrics.map((rm) => (
                <tr key={rm.retailer} className="hover:bg-[#F8F9FB] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#111318]">{rm.retailer}</td>
                  <td className="py-3 px-3 text-[#6B7280]">{rm.retailerType}</td>
                  <td className="py-3 px-3 text-center font-data tabular-nums text-[#6B7280]">{rm.skuCount}</td>
                  <td className="py-3 px-3 text-right font-data tabular-nums font-bold text-[#0F5132]">
                    ₱{rm.medianPricePer100g.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-block font-bold font-data tabular-nums px-2 py-0.5 rounded-md text-xs ${
                        rm.retailerPriceIndex < 100
                          ? 'bg-[#F0FDF4] text-[#0F5132] border border-[#DCFCE7]'
                          : rm.retailerPriceIndex > 110
                          ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                          : 'bg-[#F8F9FB] border border-[#E8E9EC] text-[#6B7280]'
                      }`}
                    >
                      {rm.retailerPriceIndex}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-data tabular-nums text-[#6B7280]">
                    {rm.promoCount} items
                  </td>
                  <td className="py-3 px-4 text-right font-data tabular-nums font-bold text-[#111318]">
                    {rm.avgDiscountPercent > 0 ? `${rm.avgDiscountPercent}%` : '&mdash;'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
