import React, { useState, useMemo } from 'react';
import {
  Network,
  Store,
  Tag,
  Info,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { NormalizedProduct } from '../../types';
import {
  RetailerPricePortfolio,
  calculateRetailerPriceArchitecture
} from '../../domain/priceArchitecture';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';

interface ChannelPriceArchitectureTabProps {
  products: NormalizedProduct[];
  marketMedian100g: number;
  onSelectProduct: (p: NormalizedProduct) => void;
}

export const ChannelPriceArchitectureTab: React.FC<ChannelPriceArchitectureTabProps> = ({
  products,
  marketMedian100g,
  onSelectProduct
}) => {
  const retailers = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.retailer))).sort();
  }, [products]);

  const [selectedRetailer, setSelectedRetailer] = useState<string>(retailers[0] || 'SM Supermarket');
  const [filterPromoOnly, setFilterPromoOnly] = useState<boolean>(false);

  const portfolio: RetailerPricePortfolio | null = useMemo(() => {
    return calculateRetailerPriceArchitecture(selectedRetailer, products, marketMedian100g);
  }, [selectedRetailer, products, marketMedian100g]);

  const filteredSKUs = useMemo(() => {
    if (!portfolio) return [];
    if (filterPromoOnly) {
      return portfolio.skus.filter((s) => s.is_on_promotion);
    }
    return portfolio.skus;
  }, [portfolio, filterPromoOnly]);

  if (!portfolio) {
    return (
      <div className="p-8 text-center text-[#6B7280]">
        No channel data available for {selectedRetailer}.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Channel Price Architecture"
        subtitle="Isolating retailer banner margins, channel-specific price ladders, and promotional depth."
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="retailer_dispersion" label="Retailer Dispersion Concepts" />
            <EvidenceBadge status="Derived" size="md" />
          </div>
        }
      />

      {/* 2. RETAILER SELECTOR */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] p-4 flex flex-wrap items-center justify-between gap-4 shadow-card font-sans">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-bold text-[#737A74]">Select Channel:</span>
          <div className="flex flex-wrap gap-1.5">
            {retailers.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRetailer(r)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRetailer.toLowerCase() === r.toLowerCase()
                    ? 'bg-[#176B4D] text-white shadow-xs'
                    : 'bg-[#FAFAF7] border border-[#E3E6DF] text-[#4F5751] hover:text-[#163829] hover:bg-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#737A74]">
          Channel Banner: <strong className="text-[#163829] font-bold">{portfolio.retailer_type}</strong>
        </div>
      </div>

      {/* 3. EXECUTIVE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans">
        <KPICard
          label="Market Price Index"
          value={portfolio.market_price_index.toFixed(1)}
          subtext="100 = Category Median Baseline"
          badge={{
            text: portfolio.market_price_index > 100
              ? `+${(portfolio.market_price_index - 100).toFixed(1)}% above`
              : `${(100 - portfolio.market_price_index).toFixed(1)}% below`,
            variant: portfolio.market_price_index > 105 ? 'warning' : portfolio.market_price_index < 95 ? 'positive' : 'neutral'
          }}
        />

        <KPICard
          label="Promotion Intensity"
          value={`${portfolio.promotion_intensity_percent.toFixed(1)}%`}
          subtext="Portion of catalog on discount"
          badge={{
            text: portfolio.average_discount_percent > 0 ? `Avg -${portfolio.average_discount_percent.toFixed(1)}%` : 'No markdowns',
            variant: 'warning'
          }}
        />

        <KPICard
          label="Audited Assortment"
          value={portfolio.sku_count}
          subtext="Audited shelf SKUs"
          badge={{ text: "Active shelf", variant: 'neutral' }}
        />

        <KPICard
          label="Unit Dispersion (IQR)"
          value={`₱${portfolio.interquartile_range_unit_price.toFixed(2)}`}
          subtext="Interquartile range (₱/100g)"
          badge={{ text: `Std: ₱${portfolio.price_dispersion_std_dev.toFixed(2)}`, variant: 'neutral' }}
        />
      </div>

      {/* 4. METHODOLOGICAL DISTINCTION NOTICE */}
      <div className="bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl p-4 text-xs text-[#4F5751] space-y-1 shadow-2xs font-sans">
        <div className="font-bold flex items-center gap-1.5 text-[#163829] uppercase tracking-wider text-[10px]">
          <Info className="w-4 h-4 text-[#176B4D] shrink-0" />
          <span>Methodology: Distinguishing Channel Effect vs Brand/SKU Effect</span>
        </div>
        <p>
          A retailer banner with an elevated overall price index may simply curate a higher proportion of premium imported SKUs (e.g., sensitivity or cosmetic whitening lines).
          To isolate the <strong>true channel effect</strong>, examine the <strong>&ldquo;Channel Differential&rdquo;</strong> column below, which compares each SKU strictly against the cross-retailer median price for that exact same SKU.
        </p>
      </div>

      {/* 5. FILTER BAR */}
      <div className="flex items-center justify-between font-sans">
        <div className="text-xs text-[#737A74]">
          Showing <strong className="text-[#163829] font-data">{filteredSKUs.length}</strong> SKUs at {selectedRetailer}
        </div>
        <button
          type="button"
          onClick={() => setFilterPromoOnly(!filterPromoOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            filterPromoOnly
              ? 'bg-[#FFFDF5] border-[#FEEBB5] text-[#B8860B]'
              : 'bg-white border-[#E3E6DF] text-[#737A74] hover:text-[#163829]'
          }`}
        >
          {filterPromoOnly ? 'Showing Promos Only' : 'Show All SKUs'}
        </button>
      </div>

      {/* 6. SKU TABLE WITH CHANNEL DIFFERENTIAL */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] overflow-hidden shadow-card font-sans">
        <div className="p-4 sm:p-5 border-b border-[#E3E6DF]">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#163829]">
            SKU Position & Channel Differential Matrix
          </h3>
          <p className="text-xs text-[#737A74] mt-0.5">
            Comparing {selectedRetailer}&apos;s shelf price directly to the multi-retailer market median for the identical SKU
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#737A74] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-semibold">Product Name & Variant</th>
                <th className="py-2.5 px-3 font-semibold">Brand</th>
                <th className="py-2.5 px-2 font-semibold">Size</th>
                <th className="py-2.5 px-3 text-right font-semibold">Retailer Shelf</th>
                <th className="py-2.5 px-3 text-right font-semibold">Cross-Channel Median</th>
                <th className="py-2.5 px-3 text-right font-semibold">Channel Diff (₱)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Channel Diff (%)</th>
                <th className="py-2.5 px-4 text-center font-semibold">Promo Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF0EA]">
              {filteredSKUs.map((sku) => {
                const isHigher = sku.retailer_differential_php > 0.1;
                const isLower = sku.retailer_differential_php < -0.1;

                return (
                  <tr key={sku.product_id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#163829] max-w-xs truncate">
                      {sku.product_name}
                    </td>

                    <td className="py-3 px-3 text-[#737A74] font-medium">
                      {sku.brand}
                    </td>

                    <td className="py-3 px-2 font-data text-[#163829]">
                      {sku.size_label}
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums font-bold text-[#163829]">
                      ₱{sku.observed_shelf_price.toFixed(2)}
                      {sku.regular_price > sku.observed_shelf_price && (
                        <div className="text-[10px] line-through text-[#737A74] font-normal">
                          ₱{sku.regular_price.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums text-[#737A74]">
                      ₱{sku.sku_market_median_price.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums font-semibold">
                      <span className={isHigher ? 'text-[#B45309]' : isLower ? 'text-[#176B4D]' : 'text-[#737A74]'}>
                        {isHigher ? `+₱${sku.retailer_differential_php.toFixed(2)}` : isLower ? `-₱${Math.abs(sku.retailer_differential_php).toFixed(2)}` : '₱0.00'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-data tabular-nums font-bold">
                      <span className={isHigher ? 'text-[#B45309]' : isLower ? 'text-[#176B4D]' : 'text-[#737A74]'}>
                        {isHigher ? `+${sku.retailer_differential_percent.toFixed(1)}%` : isLower ? `${sku.retailer_differential_percent.toFixed(1)}%` : '0.0%'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {sku.is_on_promotion ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FFFDF5] border border-[#FEEBB5] text-[#B8860B] text-[10px] font-semibold">
                          <Tag className="w-3 h-3" />
                          <span className="font-data">-{sku.discount_percent.toFixed(0)}% Off</span>
                        </span>
                      ) : (
                        <span className="text-[#737A74] text-[11px]">Regular</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
