import React, { useState } from 'react';
import {
  BarChart2,
  Info,
  Maximize2,
  Sparkles,
  Award,
  Layers,
  Check
} from 'lucide-react';
import { NormalizedProduct } from '../../types';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface ProductPositioningTabProps {
  products: NormalizedProduct[];
  marketMedian100g: number;
  onSelectProduct: (product: NormalizedProduct) => void;
}

const BRAND_COLORS: Record<string, string> = {
  Colgate: '#991B1B',
  Closeup: '#D97706',
  Sensodyne: '#0F5132',
  Hapee: '#047857',
  'Oral-B': '#1D4ED8',
  'Luxe Organix': '#7C3AED',
  Dentiste: '#475569',
  Fresh: '#059669',
  Darlie: '#6366F1',
  'Kodomo Lion': '#DB2777'
};

export const ProductPositioningTab: React.FC<ProductPositioningTabProps> = ({
  products,
  marketMedian100g,
  onSelectProduct
}) => {
  const [filterBrand, setFilterBrand] = useState<string>('all');

  const filtered = filterBrand === 'all'
    ? products
    : products.filter((p) => p.brand === filterBrand);

  const scatterData = filtered.map((p) => ({
    name: p.product_name,
    brand: p.brand,
    variant: p.variant,
    rating: p.rating,
    pricePer100g: p.price_per_100g,
    size: p.total_weight_grams,
    pricePhp: p.price_php,
    tier: p.premium_positioning,
    product: p,
    color: BRAND_COLORS[p.brand] || '#6B7280'
  }));

  const brands: string[] = Array.from(new Set<string>(products.map((p) => p.brand))).sort();
  const medianRating = 4.75;

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Product Positioning Matrix"
        subtitle="Evaluating market trade-offs across observed consumer ratings (X-axis), normalized unit price (Y-axis), and package volume (bubble size)."
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="value_score" label="Learn Value Model" />
            <EvidenceBadge status="Derived" size="md" />
          </div>
        }
      />

      {/* 2. QUADRANT LEGEND & BRAND FILTER */}
      <div className="bg-white p-5 rounded-xl border border-[#E8E9EC] shadow-card space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Filter Brand:</span>
            <select
              id="positioning-brand-select"
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="py-1.5 px-3 bg-[#F8F9FB] border border-[#E8E9EC] rounded-lg text-xs font-medium text-[#111318] focus:outline-none focus:border-[#0F5132]"
            >
              <option value="all" className="bg-white text-[#111318]">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b} className="bg-white text-[#111318]">
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Explanation Note */}
          <div className="text-[11px] text-[#6B7280]">
            *Bubble radius scales with total net content (grams).
          </div>
        </div>

        {/* 4 Quadrants Guide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F1F5F9] text-xs">
          <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
            <div className="font-bold text-[#0F5132] uppercase tracking-wider text-[10px]">Value Quadrant</div>
            <div className="text-[11px] text-[#0F5132] font-medium mt-0.5">High Rating + Low Unit Price</div>
          </div>
          <div className="p-3 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl">
            <div className="font-bold text-[#111318] uppercase tracking-wider text-[10px]">Premium Quadrant</div>
            <div className="text-[11px] text-[#6B7280] font-medium mt-0.5">High Rating + High Unit Price</div>
          </div>
          <div className="p-3 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl">
            <div className="font-bold text-[#111318] uppercase tracking-wider text-[10px]">Budget / Entry</div>
            <div className="text-[11px] text-[#6B7280] font-medium mt-0.5">Lower Price + Mass Volume</div>
          </div>
          <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl">
            <div className="font-bold text-[#B45309] uppercase tracking-wider text-[10px]">Specialty Niche</div>
            <div className="text-[11px] text-[#B45309] font-medium mt-0.5">Clinical / Formulated Specialty</div>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE SCATTER BUBBLE CHART */}
      <div className="bg-white p-6 rounded-xl border border-[#E8E9EC] shadow-card space-y-4 font-sans">
        <div className="h-96 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                type="number"
                dataKey="rating"
                name="Product Rating"
                domain={[4.2, 5.0]}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                unit=" ★"
                axisLine={{ stroke: '#E8E9EC' }}
                label={{ value: 'Observed Consumer Rating (★)', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                type="number"
                dataKey="pricePer100g"
                name="Price per 100g"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                unit="₱"
                axisLine={{ stroke: '#E8E9EC' }}
                label={{ value: 'Price per 100g (₱)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#6B7280' }}
              />
              <ZAxis type="number" dataKey="size" range={[60, 320]} name="Package Weight (g)" />

              {/* Reference line for Market Median Unit Price */}
              <ReferenceLine
                y={marketMedian100g}
                stroke="#0F5132"
                strokeDasharray="4 4"
                label={{
                  value: `Median: ₱${marketMedian100g.toFixed(2)}/100g`,
                  fill: '#0F5132',
                  fontSize: 11,
                  position: 'top'
                }}
              />
              <ReferenceLine
                x={medianRating}
                stroke="#9CA3AF"
                strokeDasharray="4 4"
                label={{
                  value: `Benchmark: ${medianRating}★`,
                  fill: '#6B7280',
                  fontSize: 10,
                  position: 'insideTopRight'
                }}
              />

              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white text-[#111318] p-3.5 rounded-xl shadow-card border border-[#E8E9EC] text-xs space-y-1 max-w-xs font-sans">
                        <div className="font-bold text-[#0F5132] text-xs uppercase tracking-wider">{data.brand}</div>
                        <div className="font-bold text-[#111318]">{data.name}</div>
                        <div className="text-[#6B7280] text-[11px]">Variant: {data.variant}</div>
                        <div className="pt-2 text-[#111318] border-t border-[#F1F5F9] mt-1 space-y-0.5">
                          <div>
                            Unit Cost: <strong className="text-[#0F5132] font-bold font-data tabular-nums">₱{data.pricePer100g.toFixed(2)} / 100g</strong>
                          </div>
                          <div>
                            Shelf Price: <strong className="font-data tabular-nums">₱{data.pricePhp.toFixed(2)}</strong> (<span className="font-data">{data.size}g</span>)
                          </div>
                          <div>
                            Rating: <strong className="font-data tabular-nums">{data.rating.toFixed(1)} ★</strong>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#9CA3AF] pt-1">
                          Click bubble to inspect SKU specifications
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Scatter
                data={scatterData}
                onClick={(e: any) => e?.product && onSelectProduct(e.product)}
                className="cursor-pointer"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Brand color legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-[#F1F5F9] text-xs">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center gap-1.5 text-[11px]">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: BRAND_COLORS[brand] || '#6B7280' }}
              />
              <span className="text-[#6B7280] font-medium">{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
