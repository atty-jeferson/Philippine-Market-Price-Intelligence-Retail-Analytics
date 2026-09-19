import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { HistoricalPricePoint } from '../../types';
import { ChartCard } from './ChartCard';
import { EvidenceStatus } from './ChartHeader';

export interface PriceTrendChartProps {
  id?: string;
  data: HistoricalPricePoint[];
  productName?: string;
  brand?: string;
  unitWeightGrams?: number;
  benchmarkPrice?: number;
  benchmarkLabel?: string;
  metricType?: 'shelf_price' | 'unit_price';
  badge?: EvidenceStatus;
  className?: string;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  id = 'price-trend-chart',
  data,
  productName,
  brand,
  unitWeightGrams = 100,
  benchmarkPrice,
  benchmarkLabel = 'Market Median Baseline',
  metricType: initialMetricType = 'shelf_price',
  badge = 'OBSERVED',
  className = ''
}) => {
  const [metricType, setMetricType] = useState<'shelf_price' | 'unit_price'>(initialMetricType);

  const formattedData = React.useMemo(() => {
    return (data || []).map((pt) => {
      const unitFactor = unitWeightGrams > 0 ? 100 / unitWeightGrams : 1;
      const shelfPrice = pt.price;
      const unitPrice = Number((shelfPrice * unitFactor).toFixed(2));
      const regularUnitPrice = pt.regular_price
        ? Number((pt.regular_price * unitFactor).toFixed(2))
        : unitPrice;

      return {
        date: pt.date,
        price: metricType === 'shelf_price' ? shelfPrice : unitPrice,
        regularPrice: metricType === 'shelf_price' ? pt.regular_price || shelfPrice : regularUnitPrice,
        isPromotion: pt.is_promotion,
        discountPercent: pt.discount_percent || 0,
        notes: pt.notes
      };
    });
  }, [data, metricType, unitWeightGrams]);

  const isEmpty = !data || data.length === 0;
  const insufficientData =
    data && data.length === 1
      ? {
          sampleSize: 1,
          requiredMinimum: 2,
          metricLabel: 'Longitudinal Trend Analysis'
        }
      : undefined;

  const unitLabel = metricType === 'shelf_price' ? '₱' : '₱/100g';

  const chartActions = (
    <div className="inline-flex rounded-lg border border-[#E3E6DF] bg-[#FAFAF7] p-0.5 text-xs font-sans">
      <button
        type="button"
        onClick={() => setMetricType('shelf_price')}
        className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
          metricType === 'shelf_price'
            ? 'bg-white text-[#176B4D] font-bold shadow-xs'
            : 'text-[#737A74] hover:text-[#163829]'
        }`}
      >
        Shelf Price (₱)
      </button>
      <button
        type="button"
        onClick={() => setMetricType('unit_price')}
        className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
          metricType === 'unit_price'
            ? 'bg-white text-[#176B4D] font-bold shadow-xs'
            : 'text-[#737A74] hover:text-[#163829]'
        }`}
      >
        Normalized (₱/100g)
      </button>
    </div>
  );

  return (
    <ChartCard
      id={id}
      title={productName ? `Price Movement: ${productName}` : 'Historical Price Movement'}
      question="How has product shelf pricing evolved over audited longitudinal cycles?"
      badge={badge}
      benchmarkLabel={
        benchmarkPrice
          ? `${benchmarkLabel}: ₱${benchmarkPrice.toFixed(2)}${metricType === 'unit_price' ? '/100g' : ''}`
          : undefined
      }
      topicKey="price_trends"
      actions={chartActions}
      sourceText="Longitudinal Store Audits (Metro Manila Trade)"
      observationPeriod="Aug 2025 – Sep 2026"
      sampleSize={data?.length || 0}
      isEmpty={isEmpty}
      insufficientData={insufficientData}
      className={className}
    >
      <div className="space-y-3">
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0EA" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#737A74' }}
                tickLine={false}
                axisLine={{ stroke: '#E3E6DF' }}
              />
              <YAxis
                unit="₱"
                tick={{ fontSize: 11, fill: '#737A74' }}
                tickLine={false}
                axisLine={{ stroke: '#E3E6DF' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white text-[#163829] p-3.5 rounded-xl border border-[#E3E6DF] text-xs space-y-1.5 shadow-card min-w-[190px]">
                        <div className="font-bold text-[#163829] border-b border-[#EEF0EA] pb-1 flex items-center justify-between">
                          <span>{item.date}</span>
                          {item.isPromotion && (
                            <span className="px-1.5 py-0.5 bg-[#FDF4F3] text-[#C04D44] border border-[#F5C8C4] rounded text-[10px] font-bold">
                              PROMO -{item.discountPercent}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#737A74]">Effective Price:</span>
                          <span className="font-data font-bold text-[#176B4D]">
                            ₱{Number(item.price).toFixed(2)}
                            {unitLabel === '₱/100g' ? '/100g' : ''}
                          </span>
                        </div>
                        {item.regularPrice && item.regularPrice !== item.price && (
                          <div className="flex items-center justify-between gap-3 text-[#737A74]">
                            <span>Regular Shelf:</span>
                            <span className="font-data line-through text-[#A8B0A8]">
                              ₱{Number(item.regularPrice).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="pt-1 text-[11px] text-[#4F5751] italic border-t border-[#EEF0EA]">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {benchmarkPrice && (
                <ReferenceLine
                  y={benchmarkPrice}
                  stroke="#A8C5B4"
                  strokeDasharray="4 4"
                  label={{
                    value: benchmarkLabel,
                    fill: '#737A74',
                    fontSize: 10,
                    position: 'top'
                  }}
                />
              )}
              {/* Regular Shelf Line (Dashed) */}
              <Line
                type="monotone"
                dataKey="regularPrice"
                name="Regular Shelf Price"
                stroke="#A8C5B4"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                dot={false}
              />
              {/* Effective Price Line (Solid) */}
              <Line
                type="monotone"
                dataKey="price"
                name="Effective Shelf Price"
                stroke="#176B4D"
                strokeWidth={2.5}
                activeDot={{ r: 5, fill: '#176B4D' }}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.isPromotion) {
                    return (
                      <circle
                        key={`promo-dot-${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill="#C04D44"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    );
                  }
                  return (
                    <circle
                      key={`regular-dot-${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill="#176B4D"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Meta Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EEF0EA] text-[11px] text-[#737A74] font-sans">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#176B4D]" />
              <span className="text-[#3B4840]">Effective Observed Price</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C04D44]" />
              <span className="text-[#3B4840]">Active Promotional Tag</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 border-b border-dashed border-[#A8C5B4]" />
              <span className="text-[#3B4840]">Regular Listed Price</span>
            </div>
          </div>
          {brand && <div className="font-data text-[#163829] font-semibold">Brand: {brand}</div>}
        </div>
      </div>
    </ChartCard>
  );
};
