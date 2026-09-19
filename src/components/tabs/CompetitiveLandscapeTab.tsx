import React, { useState, useMemo } from 'react';
import {
  Crosshair,
  Filter,
  Layers,
  ArrowUpDown,
  Tag,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
  Store,
  Scale,
  Sparkles
} from 'lucide-react';
import {
  NormalizedProduct,
  CrossRetailerSKUComparison,
  PositioningTier
} from '../../types';
import {
  CompetitiveSet,
  buildCompetitiveSet,
  ComparableSKU
} from '../../domain/competitive';
import {
  PriceWaterfall,
  calculatePriceWaterfall
} from '../../domain/priceArchitecture';
import { calculatePCI, calculateRPP } from '../../domain/statistics';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
  Cell,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface CompetitiveLandscapeTabProps {
  products: NormalizedProduct[];
  crossRetailer: CrossRetailerSKUComparison[];
  marketMedian100g: number;
  onSelectProduct: (p: NormalizedProduct) => void;
  onNavigateToOpportunities?: () => void;
}

export const CompetitiveLandscapeTab: React.FC<CompetitiveLandscapeTabProps> = ({
  products,
  crossRetailer,
  marketMedian100g,
  onSelectProduct
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedPromo, setSelectedPromo] = useState<string>('all');
  const [anchorSkuId, setAnchorSkuId] = useState<string>('all');
  const [benchmarkType, setBenchmarkType] = useState<'market' | 'brand' | 'comp_set'>('market');

  // Inspection Drawer States
  const [inspectingProduct, setInspectingProduct] = useState<NormalizedProduct | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'competitive_set' | 'waterfall'>('competitive_set');

  // Derived Filter Options
  const brands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand))).sort();
  }, [products]);

  const retailers = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.retailer))).sort();
  }, [products]);

  const tiers: PositioningTier[] = ['Budget', 'Mainstream', 'Premium', 'Specialty'];

  // Map of cross-retailer gaps
  const retailerGapMap = useMemo(() => {
    const map = new Map<string, number>();
    crossRetailer.forEach((c) => {
      const key = `${c.brand.toLowerCase()}:::${c.canonicalName.toLowerCase()}:::${c.weightGrams}`;
      map.set(key, c.percentageGap);
    });
    return map;
  }, [crossRetailer]);

  // Brand Summary Metrics for Top Cards and Institutional Delta Table
  const brandSummaries = useMemo(() => {
    const brandMap = new Map<
      string,
      {
        name: string;
        skus: NormalizedProduct[];
        totalUnitPrice: number;
        promoCount: number;
        retailers: Set<string>;
      }
    >();

    products.forEach((p) => {
      const b = p.brand;
      if (!brandMap.has(b)) {
        brandMap.set(b, {
          name: b,
          skus: [],
          totalUnitPrice: 0,
          promoCount: 0,
          retailers: new Set()
        });
      }
      const entry = brandMap.get(b)!;
      entry.skus.push(p);
      entry.totalUnitPrice += p.price_per_100g;
      if (p.discount_percent > 0 || p.sale_price_php !== null) {
        entry.promoCount += 1;
      }
      entry.retailers.add(p.retailer);
    });

    return Array.from(brandMap.values())
      .map((entry) => {
        const count = entry.skus.length;
        const avgUnitPrice = entry.totalUnitPrice / count;
        const diffFromMedian = ((avgUnitPrice - marketMedian100g) / marketMedian100g) * 100;
        const promoShare = (entry.promoCount / count) * 100;

        return {
          brand: entry.name,
          avgUnitPrice,
          diffFromMedian,
          promoCount: entry.promoCount,
          promoShare,
          skuCount: count,
          retailCoverage: entry.retailers.size
        };
      })
      .sort((a, b) => b.skuCount - a.skuCount);
  }, [products, marketMedian100g]);

  // Anchor competitive set filter
  const anchorCompetitiveSet: CompetitiveSet | null = useMemo(() => {
    if (anchorSkuId === 'all') return null;
    const anchor = products.find((p) => p.product_id === anchorSkuId);
    if (!anchor) return null;
    return buildCompetitiveSet(anchor, products);
  }, [anchorSkuId, products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.product_name.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchVariant = p.variant.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchVariant) return false;
      }

      // Brand
      if (selectedBrand !== 'all' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // Retailer
      if (selectedRetailer !== 'all' && p.retailer.toLowerCase() !== selectedRetailer.toLowerCase()) {
        return false;
      }

      // Tier
      if (selectedTier !== 'all' && p.premium_positioning !== selectedTier) {
        return false;
      }

      // Promotion
      if (selectedPromo === 'promo' && p.discount_percent <= 0 && p.sale_price_php === null) {
        return false;
      }
      if (selectedPromo === 'regular' && (p.discount_percent > 0 || p.sale_price_php !== null)) {
        return false;
      }

      // Anchor Competitive Set Filter
      if (anchorCompetitiveSet) {
        const isAnchor = p.product_id === anchorCompetitiveSet.anchor_sku_id;
        const isComparable = anchorCompetitiveSet.comparable_skus.some(
          (c) => c.product_id === p.product_id
        );
        if (!isAnchor && !isComparable) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedBrand, selectedRetailer, selectedTier, selectedPromo, anchorCompetitiveSet]);

  // Drawer Inspection Objects
  const drawerCompetitiveSet = useMemo(() => {
    if (!inspectingProduct) return null;
    return buildCompetitiveSet(inspectingProduct, products);
  }, [inspectingProduct, products]);

  const drawerWaterfall = useMemo(() => {
    if (!inspectingProduct) return null;
    return calculatePriceWaterfall(inspectingProduct, products, marketMedian100g);
  }, [inspectingProduct, products, marketMedian100g]);

  // Scatter Chart Data
  const scatterData = useMemo(() => {
    const tierOrder: Record<string, number> = { Budget: 1, Mainstream: 2, Premium: 3, Specialty: 4 };
    return filteredProducts.map((p) => ({
      name: p.product_name,
      brand: p.brand,
      retailer: p.retailer,
      pricePer100g: p.price_per_100g,
      shelfPrice: p.price_php,
      tier: p.premium_positioning,
      tierNum: tierOrder[p.premium_positioning] || 2,
      raw: p
    }));
  }, [filteredProducts]);

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Competitive Landscape"
        subtitle="Surveillance of observed shelf prices, standardized unit economics (₱/100g), objective benchmarks, and cross-retailer dispersion."
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="competitive_gap" label="Competitive Set Methodology" />
            <EvidenceBadge status="Derived" size="md" />
          </div>
        }
      />

      {/* 2. TOP BRAND SUMMARY CARDS */}
      <div className="space-y-2 font-sans">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#737A74]">
            Brand Portfolio Summary
          </span>
          <span className="text-xs text-[#737A74]">
            Benchmark: Market Median <span className="font-data tabular-nums font-bold text-[#163829]">₱{marketMedian100g.toFixed(2)}</span>/100g
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {brandSummaries.slice(0, 5).map((b) => {
            const isPremium = b.diffFromMedian > 0;

            return (
              <div
                key={b.brand}
                onClick={() => setSelectedBrand(b.brand === selectedBrand ? 'all' : b.brand)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-card ${
                  selectedBrand === b.brand
                    ? 'bg-[#EEF4EE] border-[#A8C5B4] ring-1 ring-[#A8C5B4]'
                    : 'bg-white border-[#E3E6DF] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#163829] tracking-tight truncate">
                    {b.brand}
                  </span>
                  <span className="text-[10px] font-data px-1.5 py-0.2 rounded bg-[#FAFAF7] border border-[#E3E6DF] text-[#737A74]">
                    {b.skuCount} SKUs
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-[#737A74] uppercase font-medium">Avg Unit Price</span>
                    <div className="text-sm font-bold font-data tabular-nums text-[#163829]">
                      ₱{b.avgUnitPrice.toFixed(2)}
                      <span className="text-[10px] font-normal text-[#737A74]">/100g</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#737A74] uppercase font-medium">vs Median</span>
                    <div
                      className={`text-xs font-data tabular-nums font-bold ${
                        isPremium ? 'text-[#B45309]' : 'text-[#176B4D]'
                      }`}
                    >
                      {isPremium ? `+${b.diffFromMedian.toFixed(1)}%` : `${b.diffFromMedian.toFixed(1)}%`}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#EEF0EA] flex items-center justify-between text-[10px] text-[#737A74]">
                  <span>Promo: <span className="font-data">{b.promoCount}</span> (<span className="font-data">{b.promoShare.toFixed(0)}%</span>)</span>
                  <span><span className="font-data">{b.retailCoverage}</span> Retailers</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. COMPETITIVE POSITIONING SCATTER / MATRIX */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] p-5 sm:p-6 shadow-card space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEF0EA]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#163829] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#176B4D]" />
              <span>Competitive Positioning Matrix (₱/100g vs Positioning Tier)</span>
            </h3>
            <p className="text-xs text-[#737A74] mt-0.5">
              Each point represents an observed SKU at a verified shelf audit. The vertical dashed line marks the market median.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#176B4D] bg-[#EEF4EE] border border-[#DDEBE1] px-2.5 py-1 rounded-lg font-medium">
              Median: <span className="font-data font-bold">₱{marketMedian100g.toFixed(2)}</span>/100g
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EA" />
              <XAxis
                type="number"
                dataKey="pricePer100g"
                name="Unit Price"
                unit="₱/100g"
                tick={{ fontSize: 11, fill: '#737A74' }}
                domain={['auto', 'auto']}
              />
              <YAxis
                type="number"
                dataKey="tierNum"
                name="Tier"
                domain={[0.5, 4.5]}
                ticks={[1, 2, 3, 4]}
                tickFormatter={(v) => {
                  const labels: Record<number, string> = {
                    1: 'Budget',
                    2: 'Mainstream',
                    3: 'Premium',
                    4: 'Specialty'
                  };
                  return labels[v] || '';
                }}
                tick={{ fontSize: 11, fill: '#737A74' }}
              />
              <ZAxis range={[60, 60]} />
              <RechartsTooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white text-[#163829] p-3 rounded-xl shadow-card border border-[#E3E6DF] text-xs max-w-xs space-y-1 font-sans">
                        <div className="font-bold text-[#163829]">{item.brand} &middot; {item.name}</div>
                        <div className="text-[#737A74]">Retailer: {item.retailer}</div>
                        <div className="font-mono text-[#176B4D] font-bold">Unit Price: ₱{item.pricePer100g.toFixed(2)}/100g</div>
                        <div className="font-mono text-[#737A74]">Shelf Price: ₱{item.shelfPrice.toFixed(2)}</div>
                        <div className="text-[#737A74]">Tier: {item.tier}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x={marketMedian100g}
                stroke="#176B4D"
                strokeDasharray="4 4"
                label={{ value: 'Market Median', position: 'top', fill: '#176B4D', fontSize: 11 }}
              />
              <Scatter name="SKUs" data={scatterData} onClick={(entry) => setInspectingProduct(entry.raw)}>
                {scatterData.map((entry, index) => {
                  let fill = '#176B4D';
                  if (entry.brand.toLowerCase() === 'colgate') fill = '#DC2626';
                  else if (entry.brand.toLowerCase() === 'sensodyne') fill = '#2563EB';
                  else if (entry.brand.toLowerCase() === 'close up') fill = '#D97706';
                  else if (entry.brand.toLowerCase() === 'hapee') fill = '#059669';
                  else if (entry.brand.toLowerCase() === 'oral-b') fill = '#7C3AED';
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={fill}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. BRAND VS MARKET DELTA TABLE (INSTITUTIONAL FINANCIAL REPORT STYLE) */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] overflow-hidden shadow-card">
        <div className="p-4 sm:p-5 border-b border-[#E3E6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] font-mono text-[#163829]">
              Brand vs Market Delta Matrix &middot; Institutional Audit
            </h3>
            <p className="text-xs text-[#737A74] mt-0.5">
              Portfolio metrics standardized against the overall category median (₱{marketMedian100g.toFixed(2)}/100g).
            </p>
          </div>
          <span className="text-xs text-[#737A74] font-mono">
            {brandSummaries.length} Portfolios Audited
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#737A74] font-mono uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-semibold">Brand</th>
                <th className="py-2.5 px-4 text-right font-semibold">Average Unit Price</th>
                <th className="py-2.5 px-4 text-right font-semibold">vs Market Median</th>
                <th className="py-2.5 px-4 text-center font-semibold">Observed SKUs</th>
                <th className="py-2.5 px-4 text-center font-semibold">Retail Coverage</th>
                <th className="py-2.5 px-4 text-center font-semibold">Promotion Share</th>
                <th className="py-2.5 px-4 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF0EA] font-sans">
              {brandSummaries.map((b) => {
                const isPremium = b.diffFromMedian > 0;

                return (
                  <tr
                    key={b.brand}
                    className="hover:bg-[#FAFAF7] transition-colors cursor-pointer"
                    onClick={() => setSelectedBrand(b.brand === selectedBrand ? 'all' : b.brand)}
                  >
                    <td className="py-3 px-4 font-bold text-[#163829]">
                      {b.brand}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#163829]">
                      ₱{b.avgUnitPrice.toFixed(2)}/100g
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <span className={isPremium ? 'text-[#B45309]' : 'text-[#176B4D]'}>
                        {isPremium ? `+${b.diffFromMedian.toFixed(1)}%` : `${b.diffFromMedian.toFixed(1)}%`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[#737A74]">
                      {b.skuCount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[#737A74]">
                      {b.retailCoverage} banners
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={b.promoCount > 0 ? 'text-[#176B4D] font-semibold' : 'text-[#737A74]'}>
                        {b.promoCount} ({b.promoShare.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBrand(b.brand);
                        }}
                        className="text-[11px] font-semibold text-[#176B4D] hover:underline"
                      >
                        Filter SKUs
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CONTROL BAR & SKU FILTERS */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] p-4 sm:p-5 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737A74]" />
            <input
              type="text"
              placeholder="Filter by product name, variant, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] placeholder-[#737A74] focus:outline-none focus:border-[#176B4D]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737A74] hover:text-[#163829]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Benchmark Selection */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#737A74] font-medium shrink-0 font-mono text-[11px]">Benchmark:</span>
            <div className="inline-flex rounded-lg border border-[#E3E6DF] bg-[#FAFAF7] p-0.5">
              <button
                type="button"
                onClick={() => setBenchmarkType('market')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  benchmarkType === 'market'
                    ? 'bg-white text-[#163829] shadow-xs font-semibold'
                    : 'text-[#737A74] hover:text-[#163829]'
                }`}
              >
                Market Median (₱{marketMedian100g.toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => setBenchmarkType('brand')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  benchmarkType === 'brand'
                    ? 'bg-white text-[#163829] shadow-xs font-semibold'
                    : 'text-[#737A74] hover:text-[#163829]'
                }`}
              >
                Brand Portfolio
              </button>
              <button
                type="button"
                onClick={() => setBenchmarkType('comp_set')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  benchmarkType === 'comp_set'
                    ? 'bg-white text-[#163829] shadow-xs font-semibold'
                    : 'text-[#737A74] hover:text-[#163829]'
                }`}
              >
                Comp Set Median
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-[#EEF0EA]">
          {/* Brand */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#737A74] uppercase tracking-wider mb-1">
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Retailer */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#737A74] uppercase tracking-wider mb-1">
              Retailer
            </label>
            <select
              value={selectedRetailer}
              onChange={(e) => setSelectedRetailer(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Retailers ({retailers.length})</option>
              {retailers.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Positioning Tier */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#737A74] uppercase tracking-wider mb-1">
              Positioning Tier
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Tiers</option>
              {tiers.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Promotion Status */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#737A74] uppercase tracking-wider mb-1">
              Promotion Status
            </label>
            <select
              value={selectedPromo}
              onChange={(e) => setSelectedPromo(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Pricing</option>
              <option value="promo">On Active Promotion</option>
              <option value="regular">Regular Shelf Price Only</option>
            </select>
          </div>

          {/* Anchor Competitive Set Filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#176B4D] uppercase tracking-wider mb-1">
              Anchor Comp Set
            </label>
            <select
              value={anchorSkuId}
              onChange={(e) => setAnchorSkuId(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#EEF4EE] border border-[#DDEBE1] rounded-lg text-xs text-[#176B4D] font-medium focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All SKUs (No Comp Set Filter)</option>
              {products.slice(0, 15).map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.brand} - {p.variant} ({p.size_value}{p.size_unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-[#737A74] pt-1">
          <div>
            Showing <strong className="text-[#163829]">{filteredProducts.length}</strong> of {products.length} observed SKUs
            {anchorCompetitiveSet && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#176B4D] font-medium">
                &bull; Comp set for: {anchorCompetitiveSet.anchor_product.product_name}
              </span>
            )}
          </div>
          {(selectedBrand !== 'all' || selectedRetailer !== 'all' || selectedTier !== 'all' || selectedPromo !== 'all' || anchorSkuId !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedBrand('all');
                setSelectedRetailer('all');
                setSelectedTier('all');
                setSelectedPromo('all');
                setAnchorSkuId('all');
              }}
              className="text-[#176B4D] hover:underline font-semibold"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* 6. ENTERPRISE COMPETITIVE MATRIX TABLE */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] overflow-hidden shadow-card">
        <div className="p-4 sm:p-5 border-b border-[#E3E6DF] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] font-mono text-[#163829]">
              Granular SKU Comparison Matrix
            </h3>
            <p className="text-xs text-[#737A74] mt-0.5">
              Click &ldquo;Inspect&rdquo; to review the deterministic competitive set or descriptive price waterfall.
            </p>
          </div>
          <span className="text-xs text-[#737A74] font-mono">
            {filteredProducts.length} SKUs Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#737A74] font-sans uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">SKU / Product Line</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-2">Size</th>
                <th className="py-2.5 px-3">Retailer</th>
                <th className="py-2.5 px-3 text-right">Observed Shelf</th>
                <th className="py-2.5 px-3 text-right">Unit Price (₱/100g)</th>
                <th className="py-2.5 px-3 text-right">Benchmark</th>
                <th className="py-2.5 px-3 text-right">PCI</th>
                <th className="py-2.5 px-3 text-right">RPP</th>
                <th className="py-2.5 px-3 text-center">Promo</th>
                <th className="py-2.5 px-3 text-right">Retailer Gap</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF0EA] font-sans">
              {filteredProducts.map((p) => {
                let benchmarkVal = marketMedian100g;
                let benchmarkLabel = 'Market Median';

                if (benchmarkType === 'brand') {
                  const brandPeers = products.filter((item) => item.brand.toLowerCase() === p.brand.toLowerCase());
                  const sorted = brandPeers.map((b) => b.price_per_100g).sort((a, b) => a - b);
                  benchmarkVal = sorted[Math.floor(sorted.length / 2)] || marketMedian100g;
                  benchmarkLabel = `${p.brand} Median`;
                } else if (benchmarkType === 'comp_set') {
                  const compSet = buildCompetitiveSet(p, products);
                  benchmarkVal = compSet.median_unit_price;
                  benchmarkLabel = 'Comp Set Median';
                }

                const pci = calculatePCI(p.price_per_100g, benchmarkVal);
                const rpp = calculateRPP(p.price_per_100g, benchmarkVal);

                const gapKey = `${p.brand.toLowerCase()}:::${p.variant.toLowerCase()}:::${p.weight_grams}`;
                const retailerGap = retailerGapMap.get(gapKey);

                return (
                  <tr key={p.product_id} className="hover:bg-[#FAFAF7] transition-colors">
                    {/* SKU Name */}
                    <td className="py-3 px-3 max-w-xs">
                      <div
                        className="font-bold text-[#163829] hover:text-[#176B4D] cursor-pointer truncate"
                        onClick={() => onSelectProduct(p)}
                      >
                        {p.product_name}
                      </div>
                      <div className="text-[10px] text-[#737A74] flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-[#FAFAF7] border border-[#E3E6DF] rounded">
                          {p.sub_category || 'Standard'}
                        </span>
                        <span>{p.premium_positioning} Tier</span>
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="py-3 px-3 font-semibold text-[#163829]">
                      {p.brand}
                    </td>

                    {/* Size */}
                    <td className="py-3 px-2 font-data text-[#737A74]">
                      {p.size_value}{p.size_unit}
                      {p.is_multipack && <span className="block text-[10px] text-[#B45309] font-sans">Twin</span>}
                    </td>

                    {/* Retailer */}
                    <td className="py-3 px-3 text-[#737A74]">
                      {p.retailer}
                    </td>

                    {/* Observed Shelf Price */}
                    <td className="py-3 px-3 text-right font-data tabular-nums font-bold text-[#163829]">
                      ₱{p.price_php.toFixed(2)}
                      {p.regular_price_php && p.regular_price_php > p.price_php && (
                        <div className="text-[10px] line-through text-[#737A74] font-normal">
                          ₱{p.regular_price_php.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-3 text-right font-data tabular-nums font-bold text-[#176B4D]">
                      ₱{p.price_per_100g.toFixed(2)}
                    </td>

                    {/* Benchmark Reference */}
                    <td className="py-3 px-3 text-right font-data tabular-nums text-[#737A74]">
                      ₱{benchmarkVal.toFixed(2)}
                      <span className="block text-[9px] text-[#737A74] font-sans">{benchmarkLabel}</span>
                    </td>

                    {/* PCI */}
                    <td className="py-3 px-3 text-right font-data tabular-nums font-medium">
                      <span className={pci > 110 ? 'text-[#B45309]' : pci < 90 ? 'text-[#176B4D]' : 'text-[#163829]'}>
                        {pci.toFixed(1)}
                      </span>
                    </td>

                    {/* RPP */}
                    <td className="py-3 px-3 text-right font-data tabular-nums font-medium">
                      <span className={rpp > 5 ? 'text-[#B45309]' : rpp < -5 ? 'text-[#176B4D]' : 'text-[#737A74]'}>
                        {rpp > 0 ? `+${rpp.toFixed(1)}%` : `${rpp.toFixed(1)}%`}
                      </span>
                    </td>

                    {/* Promotion Status */}
                    <td className="py-3 px-3 text-center">
                      {p.discount_percent > 0 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FFFDF5] border border-[#FEEBB5] text-[#B8860B] text-[10px] font-semibold">
                          <Tag className="w-3 h-3" />
                          <span className="font-data">-{p.discount_percent.toFixed(0)}%</span>
                        </span>
                      ) : (
                        <span className="text-[#737A74] text-[11px]">Regular</span>
                      )}
                    </td>

                    {/* Retailer Gap */}
                    <td className="py-3 px-3 text-right font-data tabular-nums text-xs">
                      {retailerGap !== undefined && retailerGap > 0 ? (
                        <span className={retailerGap >= 15 ? 'text-[#B45309] font-bold' : 'text-[#4F5751]'}>
                          {retailerGap.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[#737A74] text-[11px] font-sans">&mdash;</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingProduct(p);
                          setActiveDrawerTab('competitive_set');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAFAF7] hover:bg-[#EEF4EE] border border-[#E3E6DF] hover:border-[#DDEBE1] text-[#163829] hover:text-[#176B4D] font-semibold text-[11px] transition-colors cursor-pointer shadow-xs font-sans"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. SIDE INSPECTION DRAWER */}
      {inspectingProduct && drawerCompetitiveSet && drawerWaterfall && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/20 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-floating flex flex-col border-l border-[#E3E6DF] overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#163829] flex items-center justify-between font-sans">
              <div>
                <div className="text-[11px] text-[#176B4D] uppercase tracking-wider font-bold">
                  Competitive Intelligence Deep Dive
                </div>
                <h3 className="text-base font-bold truncate max-w-lg mt-0.5 text-[#163829]">
                  {inspectingProduct.product_name}
                </h3>
                <div className="text-xs text-[#737A74] flex items-center gap-2 mt-1">
                  <span>{inspectingProduct.brand}</span>
                  <span>&bull;</span>
                  <span>{inspectingProduct.size_value}{inspectingProduct.size_unit}</span>
                  <span>&bull;</span>
                  <span>{inspectingProduct.retailer}</span>
                  <span>&bull;</span>
                  <span className="text-[#176B4D] font-bold font-data tabular-nums">₱{inspectingProduct.price_per_100g.toFixed(2)}/100g</span>
                </div>
              </div>
              <button
                onClick={() => setInspectingProduct(null)}
                className="p-1.5 rounded-lg hover:bg-[#EEF4EE] text-[#737A74] hover:text-[#163829] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab Switcher */}
            <div className="flex border-b border-[#E3E6DF] bg-[#FAFAF7] font-sans">
              <button
                type="button"
                onClick={() => setActiveDrawerTab('competitive_set')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  activeDrawerTab === 'competitive_set'
                    ? 'border-[#176B4D] text-[#176B4D] bg-white'
                    : 'border-transparent text-[#737A74] hover:text-[#163829]'
                }`}
              >
                <Crosshair className="w-4 h-4" />
                <span>Competitive Set ({drawerCompetitiveSet.comparable_skus.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab('waterfall')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  activeDrawerTab === 'waterfall'
                    ? 'border-[#176B4D] text-[#176B4D] bg-white'
                    : 'border-transparent text-[#737A74] hover:text-[#163829]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Price Waterfall</span>
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 font-sans">
              {activeDrawerTab === 'competitive_set' && (
                <div className="space-y-5">
                  {/* Summary Card */}
                  <div className="bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-[10px] text-[#737A74] uppercase font-bold">Tier 1 Strong</div>
                      <div className="text-xl font-bold font-data text-[#176B4D] mt-0.5">{drawerCompetitiveSet.tier1_count}</div>
                      <div className="text-[10px] text-[#737A74]">Direct substitutes</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#737A74] uppercase font-bold">Tier 2 Moderate</div>
                      <div className="text-xl font-bold font-data text-[#B45309] mt-0.5">{drawerCompetitiveSet.tier2_count}</div>
                      <div className="text-[10px] text-[#737A74]">Cross-format/tier</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#737A74] uppercase font-bold">Comp Set Median</div>
                      <div className="text-xl font-bold text-[#163829] font-data tabular-nums mt-0.5">
                        ₱{drawerCompetitiveSet.median_unit_price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#737A74]">₱/100g baseline</div>
                    </div>
                  </div>

                  {/* Comparables List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#163829] uppercase tracking-wider">
                      Comparable Products &amp; Similarity Criteria
                    </h4>

                    {drawerCompetitiveSet.comparable_skus.length === 0 ? (
                      <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl text-xs text-[#737A74] text-center">
                        No comparable SKUs detected in the current catalog.
                      </div>
                    ) : (
                      drawerCompetitiveSet.comparable_skus.map((comp) => {
                        const isTier1 = comp.tier === 'tier1_strong';
                        return (
                          <div
                            key={comp.sku_id}
                            className="bg-white border border-[#E3E6DF] rounded-xl p-3.5 hover:border-[#CBD5E1] transition-colors space-y-2 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      isTier1
                                        ? 'bg-[#EEF4EE] border border-[#DDEBE1] text-[#176B4D]'
                                        : comp.tier === 'tier2_moderate'
                                        ? 'bg-[#FFFDF5] border border-[#FEEBB5] text-[#B8860B]'
                                        : 'bg-[#FAFAF7] text-[#737A74]'
                                    }`}
                                  >
                                    {isTier1 ? 'Tier 1 · Strong' : comp.tier === 'tier2_moderate' ? 'Tier 2 · Moderate' : 'Tier 3 · Contextual'}
                                  </span>
                                  <span className="font-bold text-[#163829] text-xs">
                                    {comp.brand} &middot; {comp.product_name}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#737A74] mt-0.5">
                                  {comp.size_value}{comp.size_unit} &bull; {comp.retailer} &bull; {comp.positioning_tier}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-bold text-xs text-[#163829] font-data tabular-nums">₱{comp.price_php.toFixed(2)}</div>
                                <div className="text-[11px] text-[#176B4D] font-data tabular-nums">₱{comp.price_per_100g.toFixed(2)}/100g</div>
                                <div className={`text-[10px] font-data ${comp.unit_price_diff_percent > 0 ? 'text-[#B45309]' : 'text-[#176B4D]'}`}>
                                  {comp.unit_price_diff_percent > 0 ? `+${comp.unit_price_diff_percent}%` : `${comp.unit_price_diff_percent}%`} vs anchor
                                </div>
                              </div>
                            </div>

                            <div className="bg-[#FAFAF7] rounded-lg p-2.5 text-[11px] text-[#4F5751] space-y-1 border border-[#E3E6DF]">
                              <div className="font-semibold text-[#163829]">Similarity Criteria:</div>
                              <ul className="list-disc list-inside space-y-0.5 text-[#737A74]">
                                {comp.reasons.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeDrawerTab === 'waterfall' && (
                <div className="space-y-4 font-sans">
                  <div className="p-3 bg-[#EEF4EE] border border-[#DDEBE1] rounded-lg text-xs text-[#176B4D]">
                    <strong>Descriptive Price Decomposition:</strong> Reconciles the observed shelf price (<span className="font-data font-bold">₱{drawerWaterfall.observed_shelf_price.toFixed(2)}</span>) from the broad market median reference through brand, SKU formulation, and channel adjustments.
                  </div>

                  <div className="space-y-2.5">
                    {drawerWaterfall.steps.map((step, idx) => {
                      const isNegative = step.value_php < 0;
                      const isFinal = step.category === 'final_price';
                      const isBenchmark = step.category === 'benchmark';

                      return (
                        <div
                          key={step.step_id}
                          className={`p-3 rounded-xl border ${
                            isFinal
                              ? 'bg-[#EEF4EE] text-[#163829] border-[#DDEBE1]'
                              : isBenchmark
                              ? 'bg-[#FAFAF7] border-[#E3E6DF]'
                              : 'bg-white border-[#E3E6DF]'
                          } flex items-center justify-between gap-4`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                                isFinal ? 'bg-[#DDEBE1] text-[#176B4D]' : 'bg-[#E3E6DF] text-[#4F5751]'
                              }`}>
                                Step 0{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-[#163829]">
                                {step.label}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#737A74]">
                              {step.description}
                            </div>
                            <div className={`font-data text-[10px] ${isFinal ? 'text-[#176B4D] font-semibold' : 'text-[#737A74]'}`}>
                              Formula: {step.formula}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className={`text-sm font-bold font-data tabular-nums ${
                              isFinal
                                ? 'text-[#176B4D] text-base font-extrabold'
                                : isBenchmark
                                ? 'text-[#163829]'
                                : isNegative
                                ? 'text-[#176B4D]'
                                : 'text-[#B45309]'
                            }`}>
                              {!isFinal && !isBenchmark && (step.value_php > 0 ? '+' : '')}
                              ₱{step.value_php.toFixed(2)}
                            </div>
                            {!isFinal && (
                              <div className="text-[10px] font-data tabular-nums text-[#737A74]">
                                Running: ₱{step.cumulative_php.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-[#FFFDF5] border border-[#FEEBB5] rounded-lg p-3 text-[11px] text-[#B8860B] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span>Analytical Waterfall Caveats</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[#B8860B]">
                      {drawerWaterfall.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
