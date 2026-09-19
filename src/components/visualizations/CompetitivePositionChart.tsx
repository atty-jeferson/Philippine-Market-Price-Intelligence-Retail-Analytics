import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { NormalizedProduct } from '../../types';
import { ChartCard } from './ChartCard';
import { EvidenceStatus } from './ChartHeader';

export interface CompetitivePositionChartProps {
  id?: string;
  products: NormalizedProduct[];
  marketMedian100g: number;
  onSelectProduct?: (product: NormalizedProduct) => void;
  selectedProductId?: string | null;
  badge?: EvidenceStatus;
  className?: string;
}

const BRAND_PALETTE: Record<string, string> = {
  Colgate: '#C0392B',
  Closeup: '#EA580C',
  Sensodyne: '#1D5FA7',
  Hapee: '#16845B',
  'Oral-B': '#0891B2',
  'Luxe Organix': '#9333EA',
  Dentiste: '#334155',
  Fresh: '#10B981',
  Darlie: '#B7791F',
  'Kodomo Lion': '#EC4899'
};

const FALLBACK_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706', '#4B5563'
];

export const CompetitivePositionChart: React.FC<CompetitivePositionChartProps> = ({
  id = 'competitive-position-chart',
  products,
  marketMedian100g,
  onSelectProduct,
  selectedProductId,
  badge = 'DERIVED',
  className = ''
}) => {
  const [yAxisMetric, setYAxisMetric] = useState<'tier' | 'rating'>('tier');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  const brands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand))).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedBrand === 'all') return products;
    return products.filter((p) => p.brand === selectedBrand);
  }, [products, selectedBrand]);

  const scatterData = useMemo(() => {
    const tierMap: Record<string, number> = {
      Budget: 1,
      Mainstream: 2,
      Premium: 3,
      Specialty: 4
    };

    return filteredProducts.map((p, idx) => {
      let color = BRAND_PALETTE[p.brand];
      if (!color) {
        const brandIdx = brands.indexOf(p.brand);
        color = FALLBACK_COLORS[brandIdx % FALLBACK_COLORS.length] || '#64748B';
      }

      return {
        id: p.product_id,
        name: p.product_name,
        brand: p.brand,
        variant: p.variant,
        retailer: p.retailer,
        pricePer100g: p.price_per_100g,
        pricePhp: p.price_php,
        weightGrams: p.total_weight_grams,
        rating: p.rating || 4.5,
        tierName: p.premium_positioning,
        tierNum: tierMap[p.premium_positioning] || 2,
        isOnSale: p.is_on_sale,
        discountPercent: p.discount_percent || 0,
        color,
        rawProduct: p
      };
    });
  }, [filteredProducts, brands]);

  const isEmpty = products.length === 0;

  const chartActions = (
    <div className="flex flex-wrap items-center gap-2 font-sans">
      <select
        value={selectedBrand}
        onChange={(e) => setSelectedBrand(e.target.value)}
        className="py-1 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] focus:outline-none focus:border-[#176B4D] cursor-pointer"
      >
        <option value="all">All Brands ({brands.length})</option>
        {brands.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      <div className="inline-flex rounded-lg border border-[#E3E6DF] bg-[#FAFAF7] p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setYAxisMetric('tier')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
            yAxisMetric === 'tier'
              ? 'bg-white text-[#176B4D] font-bold shadow-xs'
              : 'text-[#737A74] hover:text-[#163829]'
          }`}
        >
          By Tier
        </button>
        <button
          type="button"
          onClick={() => setYAxisMetric('rating')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
            yAxisMetric === 'rating'
              ? 'bg-white text-[#176B4D] font-bold shadow-xs'
              : 'text-[#737A74] hover:text-[#163829]'
          }`}
        >
          By Rating
        </button>
      </div>
    </div>
  );

  return (
    <ChartCard
      id={id}
      title="Competitive Price Positioning Matrix"
      question="Where do brand SKUs cluster across price tiers and unit costs?"
      badge={badge}
      benchmarkLabel={`Market Median: ₱${marketMedian100g.toFixed(2)}/100g`}
      topicKey="brand_premium"
      actions={chartActions}
      sourceText="Store Audits & Assortment Pricing"
      observationPeriod="Audit Cycle Sep 2026"
      sampleSize={filteredProducts.length}
      isEmpty={isEmpty}
      className={className}
    >
      <div className="space-y-3 font-sans">
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload[0] && onSelectProduct) {
                  const item = state.activePayload[0].payload;
                  if (item.rawProduct) {
                    onSelectProduct(item.rawProduct);
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EA" />
              <XAxis
                type="number"
                dataKey="pricePer100g"
                name="Unit Price"
                unit="₱/100g"
                tick={{ fontSize: 11, fill: '#737A74' }}
                axisLine={{ stroke: '#E3E6DF' }}
              />
              <YAxis
                type="number"
                dataKey={yAxisMetric === 'tier' ? 'tierNum' : 'rating'}
                name={yAxisMetric === 'tier' ? 'Positioning Tier' : 'Consumer Rating'}
                domain={yAxisMetric === 'tier' ? [0.5, 4.5] : [3.8, 5.0]}
                ticks={yAxisMetric === 'tier' ? [1, 2, 3, 4] : [4.0, 4.25, 4.5, 4.75, 5.0]}
                tickFormatter={(v) => {
                  if (yAxisMetric === 'tier') {
                    const labels: Record<number, string> = {
                      1: 'Budget',
                      2: 'Mainstream',
                      3: 'Premium',
                      4: 'Specialty'
                    };
                    return labels[v] || '';
                  }
                  return `${v.toFixed(1)} ★`;
                }}
                tick={{ fontSize: 11, fill: '#737A74' }}
                axisLine={{ stroke: '#E3E6DF' }}
              />
              <ZAxis
                type="number"
                dataKey="weightGrams"
                range={[40, 160]}
                name="Pack Size (g)"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white text-[#163829] p-3.5 rounded-xl border border-[#E3E6DF] text-xs space-y-1.5 shadow-card min-w-[220px] font-sans">
                        <div className="font-bold text-[#163829] border-b border-[#EEF0EA] pb-1">
                          {item.brand} {item.variant}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#737A74]">Audited Banner:</span>
                          <span className="font-medium text-[#163829]">{item.retailer}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#737A74]">Shelf Price:</span>
                          <span className="font-data font-bold text-[#163829]">
                            ₱{item.pricePhp.toFixed(2)} ({item.weightGrams}g)
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#737A74]">Unit Price:</span>
                          <span className="font-data font-bold text-[#176B4D]">
                            ₱{item.pricePer100g.toFixed(2)}/100g
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[11px] pt-1 border-t border-[#EEF0EA]">
                          <span className="text-[#737A74]">Positioning:</span>
                          <span className="font-medium text-[#4F5751]">{item.tierName}</span>
                        </div>
                        {item.isOnSale && (
                          <div className="text-[10px] text-[#C04D44] font-bold">
                            On Active Promo: -{item.discountPercent}%
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Category Median Reference Line */}
              <ReferenceLine
                x={marketMedian100g}
                stroke="#737A74"
                strokeDasharray="4 4"
                label={{
                  value: `Market Median (₱${marketMedian100g.toFixed(2)})`,
                  fill: '#3B4840',
                  fontSize: 10,
                  position: 'top'
                }}
              />
              <Scatter
                name="Products"
                data={scatterData}
                cursor={onSelectProduct ? 'pointer' : 'default'}
              >
                {scatterData.map((entry) => (
                  <Cell
                    key={`point-${entry.id}`}
                    fill={entry.color}
                    fillOpacity={selectedProductId === entry.id ? 1 : 0.8}
                    stroke={selectedProductId === entry.id ? '#163829' : '#FFFFFF'}
                    strokeWidth={selectedProductId === entry.id ? 2.5 : 1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Key */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EEF0EA] text-[11px] text-[#737A74]">
          <div className="flex flex-wrap items-center gap-3">
            {brands.slice(0, 6).map((b) => (
              <div key={b} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: BRAND_PALETTE[b] || '#737A74' }}
                />
                <span className="text-[#3B4840]">{b}</span>
              </div>
            ))}
          </div>
          <div className="font-data text-[#737A74]">Bubble area = Pack weight (g)</div>
        </div>
      </div>
    </ChartCard>
  );
};
