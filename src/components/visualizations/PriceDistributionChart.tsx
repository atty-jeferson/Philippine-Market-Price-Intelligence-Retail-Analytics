import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts';
import { NormalizedProduct } from '../../types';
import { ChartCard } from './ChartCard';
import { EvidenceStatus } from './ChartHeader';

export interface PriceBin {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage?: number;
  products?: NormalizedProduct[];
}

interface PriceDistributionChartProps {
  id?: string;
  products: NormalizedProduct[];
  marketMedian100g: number;
  q1Price?: number;
  q3Price?: number;
  iqrPrice?: number;
  bins?: PriceBin[];
  onSelectBin?: (bin: PriceBin) => void;
  badge?: EvidenceStatus;
  className?: string;
}

const DEFAULT_BIN_CONFIG = [
  { label: '< ₱50', min: 0, max: 50 },
  { label: '₱50 – ₱80', min: 50, max: 80 },
  { label: '₱80 – ₱120', min: 80, max: 120 },
  { label: '₱120 – ₱160', min: 120, max: 160 },
  { label: '₱160 – ₱220', min: 160, max: 220 },
  { label: '₱220 – ₱300', min: 220, max: 300 },
  { label: '> ₱300', min: 300, max: 99999 }
];

const BIN_COLORS = [
  '#4B735E', // Budget entry
  '#2E7D5B', // Value tier
  '#176B4D', // Core mainstream (Primary)
  '#13583E', // Upper mainstream
  '#0E4430', // Premium
  '#B8860B', // Super-premium
  '#8C6207'  // Specialty / ultra-high
];

export const PriceDistributionChart: React.FC<PriceDistributionChartProps> = ({
  id = 'price-distribution-chart',
  products,
  marketMedian100g,
  q1Price,
  q3Price,
  iqrPrice,
  bins: customBins,
  onSelectBin,
  badge = 'DERIVED',
  className = ''
}) => {
  // Compute bins if not provided
  const computedBins: PriceBin[] = React.useMemo(() => {
    if (customBins) return customBins;

    const baseBins: PriceBin[] = DEFAULT_BIN_CONFIG.map((b) => ({
      ...b,
      count: 0,
      products: []
    }));

    products.forEach((p) => {
      const targetBin = baseBins.find(
        (bin) => p.price_per_100g >= bin.min && p.price_per_100g < bin.max
      );
      if (targetBin) {
        targetBin.count++;
        targetBin.products?.push(p);
      }
    });

    const total = products.length || 1;
    return baseBins.map((b) => ({
      ...b,
      percentage: Number(((b.count / total) * 100).toFixed(1))
    }));
  }, [products, customBins]);

  const isEmpty = products.length === 0;
  const insufficientData =
    products.length > 0 && products.length < 5
      ? {
          sampleSize: products.length,
          requiredMinimum: 5,
          metricLabel: 'Unit Price Distribution'
        }
      : undefined;

  const benchmarkText =
    q1Price !== undefined && q3Price !== undefined
      ? `IQR: ₱${(iqrPrice ?? (q3Price - q1Price)).toFixed(2)}/100g (Q1: ₱${q1Price.toFixed(2)} – Q3: ₱${q3Price.toFixed(2)})`
      : `Market Median: ₱${marketMedian100g.toFixed(2)}/100g`;

  return (
    <ChartCard
      id={id}
      title="Unit Price Distribution (₱/100g)"
      question="How are observed oral care prices clustered across standardized unit cost tiers?"
      badge={badge}
      benchmarkLabel={benchmarkText}
      topicKey="price_dispersion"
      sourceText="Modern Trade Shelf Audits (Metro Manila)"
      observationPeriod="Audit Cycle Sep 2026"
      sampleSize={products.length}
      isEmpty={isEmpty}
      insufficientData={insufficientData}
      className={className}
    >
      <div className="space-y-3">
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={computedBins}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload[0] && onSelectBin) {
                  onSelectBin(state.activePayload[0].payload as PriceBin);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0EA" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#737A74' }}
                tickLine={false}
                axisLine={{ stroke: '#E3E6DF' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#737A74' }}
                tickLine={false}
                axisLine={{ stroke: '#E3E6DF' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as PriceBin;
                    const sampleBrands = Array.from(
                      new Set(data.products?.map((p) => p.brand) || [])
                    ).slice(0, 3);

                    return (
                      <div className="bg-white text-[#163829] p-3 rounded-xl border border-[#E3E6DF] text-xs space-y-1.5 shadow-card min-w-[200px]">
                        <div className="font-bold text-[#163829] border-b border-[#EEF0EA] pb-1">
                          Cohort {data.label}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#737A74]">Observed SKUs:</span>
                          <span className="font-data font-bold text-[#176B4D]">
                            {data.count} ({data.percentage ?? 0}%)
                          </span>
                        </div>
                        {sampleBrands.length > 0 && (
                          <div className="pt-1 text-[11px] text-[#737A74]">
                            <span className="font-medium text-[#4F5751]">Key brands:</span>{' '}
                            {sampleBrands.join(', ')}
                          </div>
                        )}
                        <div className="text-[10px] text-[#737A74] font-data pt-1 border-t border-[#EEF0EA]">
                          Standardized at ₱/100g net content
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} cursor={onSelectBin ? 'pointer' : 'default'}>
                {computedBins.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BIN_COLORS[index % BIN_COLORS.length]}
                    className="hover:opacity-85 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Statistical Range Context Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EEF0EA] text-center text-xs">
          <div className="bg-[#FAFAF7] p-2.5 rounded-lg border border-[#E3E6DF]">
            <div className="text-[10px] uppercase font-semibold text-[#737A74] font-sans">25th Percentile (Q1)</div>
            <div className="font-data font-bold text-[#163829] mt-0.5">
              ₱{q1Price ? q1Price.toFixed(2) : (marketMedian100g * 0.75).toFixed(2)}/100g
            </div>
          </div>
          <div className="bg-[#EEF4EE] p-2.5 rounded-lg border border-[#DDEBE1]">
            <div className="text-[10px] uppercase font-semibold text-[#176B4D] font-sans">Market Median (Base 100)</div>
            <div className="font-data font-bold text-[#176B4D] mt-0.5">
              ₱{marketMedian100g.toFixed(2)}/100g
            </div>
          </div>
          <div className="bg-[#FAFAF7] p-2.5 rounded-lg border border-[#E3E6DF]">
            <div className="text-[10px] uppercase font-semibold text-[#737A74] font-sans">75th Percentile (Q3)</div>
            <div className="font-data font-bold text-[#163829] mt-0.5">
              ₱{q3Price ? q3Price.toFixed(2) : (marketMedian100g * 1.35).toFixed(2)}/100g
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  );
};
