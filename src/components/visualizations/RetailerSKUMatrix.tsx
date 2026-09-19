import React, { useState } from 'react';
import { CrossRetailerSKUComparison } from '../../types';

interface RetailerSKUMatrixProps {
  crossRetailerSKUs: CrossRetailerSKUComparison[];
  marketMedian100g: number;
  onSelectSKU?: (sku: CrossRetailerSKUComparison) => void;
}

export const RetailerSKUMatrix: React.FC<RetailerSKUMatrixProps> = ({
  crossRetailerSKUs,
  marketMedian100g,
  onSelectSKU
}) => {
  const [viewMode, setViewMode] = useState<'price_per_100g' | 'price_index' | 'shelf_price'>('price_per_100g');
  const [hoveredCell, setHoveredCell] = useState<{ sku: string; retailer: string } | null>(null);

  // Extract all distinct retailers across comparable SKUs
  const allRetailers: string[] = Array.from(
    new Set<string>(crossRetailerSKUs.flatMap((sku) => sku.retailers.map((r) => r.retailer)))
  ).sort();

  // Helper for cell color based on price index vs median
  const getCellBg = (pricePer100g: number, isMissing: boolean) => {
    if (isMissing) return 'bg-[#FAFAF7] text-[#A8B0A8]';
    const index = (pricePer100g / (marketMedian100g || 1)) * 100;
    if (index < 85) return 'bg-[#EEF4EE] text-[#176B4D] font-bold';
    if (index < 98) return 'bg-[#EEF4EE]/60 text-[#176B4D] font-medium';
    if (index <= 105) return 'bg-white text-[#163829]';
    if (index <= 120) return 'bg-[#FFFDF5] text-[#B8860B]';
    return 'bg-[#FDF4F3] text-[#C04D44] font-bold';
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-[#FAFAF7] p-1 rounded-lg border border-[#E3E6DF]">
          <button
            type="button"
            onClick={() => setViewMode('price_per_100g')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'price_per_100g'
                ? 'bg-white text-[#176B4D] shadow-xs font-bold'
                : 'text-[#737A74] hover:text-[#163829]'
            }`}
          >
            ₱ / 100g Standard
          </button>
          <button
            type="button"
            onClick={() => setViewMode('price_index')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'price_index'
                ? 'bg-white text-[#176B4D] shadow-xs font-bold'
                : 'text-[#737A74] hover:text-[#163829]'
            }`}
          >
            Price Index (100 = Median)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('shelf_price')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'shelf_price'
                ? 'bg-white text-[#176B4D] shadow-xs font-bold'
                : 'text-[#737A74] hover:text-[#163829]'
            }`}
          >
            Shelf Tag (₱)
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#737A74]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-2xs bg-[#EEF4EE] border border-[#DDEBE1]" />
            <span>Competitive (&lt; 98)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-2xs bg-white border border-[#E3E6DF]" />
            <span>At Benchmark (~100)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-2xs bg-[#FDF4F3] border border-[#F5C8C4]" />
            <span>Premium (&gt; 120)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-2xs bg-[#FAFAF7] border border-[#E3E6DF] text-[#737A74] font-data text-[9px] flex items-center justify-center">
              —
            </span>
            <span>Not Observed</span>
          </span>
        </div>
      </div>

      <div className="border border-[#E3E6DF] rounded-xl overflow-x-auto bg-white shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#737A74] font-medium text-[11px]">
              <th className="py-2.5 px-3.5 sticky left-0 bg-[#FAFAF7] z-10 min-w-[200px] border-r border-[#E3E6DF] font-bold text-[#163829]">
                Identical SKU & Format
              </th>
              {allRetailers.map((retailer) => (
                <th
                  key={retailer}
                  className="py-2.5 px-3 text-center min-w-[110px] font-bold text-[#163829] border-r border-[#EEF0EA] last:border-r-0"
                >
                  {retailer}
                </th>
              ))}
              <th className="py-2.5 px-3 text-right font-bold text-[#163829] min-w-[90px] bg-[#F4F5EF]">
                Channel Gap
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF0EA]">
            {crossRetailerSKUs.map((sku) => {
              const retailerMap = new Map<string, CrossRetailerSKUComparison['retailers'][number]>(
                sku.retailers.map((r) => [r.retailer, r])
              );

              return (
                <tr
                  key={sku.canonicalName}
                  className="hover:bg-[#FAFAF7] transition-colors cursor-pointer"
                  onClick={() => onSelectSKU && onSelectSKU(sku)}
                >
                  <td className="py-2.5 px-3.5 sticky left-0 bg-white group-hover:bg-[#FAFAF7] z-10 border-r border-[#E3E6DF]">
                    <div className="font-bold text-[#163829] truncate max-w-[220px]">
                      {sku.canonicalName}
                    </div>
                    <div className="text-[10px] text-[#737A74] flex items-center gap-1.5 font-data">
                      <span>{sku.brand}</span>
                      <span>•</span>
                      <span>{sku.size}</span>
                    </div>
                  </td>

                  {allRetailers.map((ret) => {
                    const obs = retailerMap.get(ret);
                    const isMissing = !obs;
                    const price100g = obs?.pricePer100g || 0;
                    const index = obs ? ((price100g / (marketMedian100g || 1)) * 100).toFixed(0) : '—';
                    const shelf = obs ? `₱${obs.price.toFixed(2)}` : '—';
                    const unit100g = obs ? `₱${price100g.toFixed(2)}` : '—';

                    let displayVal = unit100g;
                    if (viewMode === 'price_index') displayVal = obs ? `${index}` : '—';
                    if (viewMode === 'shelf_price') displayVal = shelf;

                    return (
                      <td
                        key={ret}
                        className={`py-2 px-2 text-center font-data text-[11px] border-r border-[#EEF0EA] last:border-r-0 transition-all ${getCellBg(
                          price100g,
                          isMissing
                        )}`}
                        onMouseEnter={() => setHoveredCell({ sku: sku.canonicalName, retailer: ret })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {displayVal}
                        {obs?.isOnSale && (
                          <span className="ml-1 text-[9px] text-[#B8860B] font-bold">
                            (P)
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-2 px-3 text-right font-data text-[11px] bg-[#F4F5EF]/60 border-l border-[#E3E6DF]">
                    <span className="font-bold text-[#C04D44]">
                      +{sku.percentageGap.toFixed(1)}%
                    </span>
                    <div className="text-[9px] text-[#737A74]">
                      ₱{sku.absoluteGap.toFixed(2)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
