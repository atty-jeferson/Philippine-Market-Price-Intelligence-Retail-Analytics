import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { ChartCard } from './ChartCard';
import { EvidenceStatus } from './ChartHeader';

export interface RetailerMetricItem {
  retailer: string;
  retailerType?: string;
  medianPricePer100g: number;
  retailerPriceIndex: number;
  skuCount: number;
  promoCount?: number;
  avgDiscountPercent?: number;
}

interface RetailerComparisonChartProps {
  id?: string;
  metrics: RetailerMetricItem[];
  marketMedian100g: number;
  onSelectRetailer?: (retailer: string) => void;
  selectedRetailer?: string | null;
  badge?: EvidenceStatus;
  className?: string;
}

export const RetailerComparisonChart: React.FC<RetailerComparisonChartProps> = ({
  id = 'retailer-comparison-chart',
  metrics,
  marketMedian100g,
  onSelectRetailer,
  selectedRetailer,
  badge = 'DERIVED',
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'index' | 'price'>('index');

  const sortedData = React.useMemo(() => {
    return [...metrics].sort((a, b) => {
      if (viewMode === 'index') {
        return a.retailerPriceIndex - b.retailerPriceIndex;
      }
      return a.medianPricePer100g - b.medianPricePer100g;
    });
  }, [metrics, viewMode]);

  const isEmpty = !metrics || metrics.length === 0;

  const chartActions = (
    <div className="inline-flex rounded-lg border border-[#E3E6DF] bg-[#FAFAF7] p-0.5 text-xs font-sans">
      <button
        type="button"
        onClick={() => setViewMode('index')}
        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
          viewMode === 'index'
            ? 'bg-white text-[#176B4D] font-bold shadow-xs'
            : 'text-[#737A74] hover:text-[#163829]'
        }`}
      >
        Price Index (100)
      </button>
      <button
        type="button"
        onClick={() => setViewMode('price')}
        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
          viewMode === 'price'
            ? 'bg-white text-[#176B4D] font-bold shadow-xs'
            : 'text-[#737A74] hover:text-[#163829]'
        }`}
      >
        Median Unit (₱/100g)
      </button>
    </div>
  );

  return (
    <ChartCard
      id={id}
      title="Retailer Price Index Comparison"
      question="Which retail banners price above or below category market median?"
      badge={badge}
      benchmarkLabel={`Category Median: ₱${marketMedian100g.toFixed(2)}/100g (Index 100.0)`}
      topicKey="channel_dispersion"
      actions={chartActions}
      sourceText="Store Audits & Supermarket Scrapes"
      observationPeriod="Audit Cycle Sep 2026"
      sampleSize={metrics.reduce((acc, m) => acc + m.skuCount, 0)}
      isEmpty={isEmpty}
      className={className}
    >
      <div className="space-y-3">
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload[0] && onSelectRetailer) {
                  const item = state.activePayload[0].payload as RetailerMetricItem;
                  onSelectRetailer(item.retailer);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF0EA" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#737A74', fontFamily: 'monospace' }}
                unit={viewMode === 'index' ? '' : '₱'}
                domain={viewMode === 'index' ? [70, 140] : ['auto', 'auto']}
                axisLine={{ stroke: '#E3E6DF' }}
              />
              <YAxis
                type="category"
                dataKey="retailer"
                tick={{ fontSize: 11, fill: '#163829', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#E3E6DF' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as RetailerMetricItem;
                    const deltaIndex = d.retailerPriceIndex - 100;
                    return (
                      <div className="bg-white text-[#163829] p-3.5 rounded-xl border border-[#E3E6DF] text-xs space-y-1.5 shadow-card min-w-[210px] font-sans">
                        <div className="font-bold text-[#163829] border-b border-[#EEF0EA] pb-1 flex items-center justify-between">
                          <span>{d.retailer}</span>
                          {d.retailerType && (
                            <span className="text-[10px] text-[#737A74] font-normal">
                              {d.retailerType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#737A74]">Retailer Price Index:</span>
                          <span
                            className={`font-data font-bold ${
                              deltaIndex < 0
                                ? 'text-[#176B4D]'
                                : deltaIndex > 5
                                ? 'text-[#B8860B]'
                                : 'text-[#163829]'
                            }`}
                          >
                            {d.retailerPriceIndex} ({deltaIndex >= 0 ? `+${deltaIndex.toFixed(1)}%` : `${deltaIndex.toFixed(1)}%`})
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#737A74]">Median Unit Price:</span>
                          <span className="font-data font-bold text-[#176B4D]">
                            ₱{d.medianPricePer100g.toFixed(2)}/100g
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[#737A74] text-[11px] pt-1 border-t border-[#EEF0EA]">
                          <span>Observed Assortment:</span>
                          <span className="font-data font-bold text-[#163829]">{d.skuCount} SKUs</span>
                        </div>
                        {d.promoCount !== undefined && d.promoCount > 0 && (
                          <div className="text-[11px] text-[#B8860B] font-medium">
                            {d.promoCount} items on active discount (avg {d.avgDiscountPercent ?? 0}%)
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {viewMode === 'index' && (
                <ReferenceLine
                  x={100}
                  stroke="#737A74"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Market Benchmark 100',
                    fill: '#3B4840',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}
              {viewMode === 'price' && (
                <ReferenceLine
                  x={marketMedian100g}
                  stroke="#737A74"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Median ₱${marketMedian100g.toFixed(2)}`,
                    fill: '#3B4840',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}
              <Bar
                dataKey={viewMode === 'index' ? 'retailerPriceIndex' : 'medianPricePer100g'}
                radius={[0, 4, 4, 0]}
                cursor={onSelectRetailer ? 'pointer' : 'default'}
              >
                {sortedData.map((entry) => {
                  let fillColor = '#176B4D';
                  if (viewMode === 'index') {
                    if (entry.retailerPriceIndex < 98) {
                      fillColor = '#4D9078'; // Value / hypermarket
                    } else if (entry.retailerPriceIndex > 105) {
                      fillColor = '#B8860B'; // Premium / pharmacy premium
                    } else {
                      fillColor = '#176B4D'; // Brand deep green
                    }
                  }
                  const isSelected = selectedRetailer === entry.retailer;
                  return (
                    <Cell
                      key={`bar-${entry.retailer}`}
                      fill={fillColor}
                      stroke={isSelected ? '#163829' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      className="hover:opacity-85 transition-opacity"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Semantic Color Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EEF0EA] text-[11px] text-[#737A74] font-sans">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#4D9078]" />
              <span className="text-[#3B4840]">Value Channel (&lt; 98 Index)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#176B4D]" />
              <span className="text-[#3B4840]">Market Baseline (98 &ndash; 105 Index)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#B8860B]" />
              <span className="text-[#3B4840]">Premium / Pharmacy (&gt; 105 Index)</span>
            </div>
          </div>
          <div className="font-data text-[#737A74]">Dashed line = Market Parity (100)</div>
        </div>
      </div>
    </ChartCard>
  );
};
