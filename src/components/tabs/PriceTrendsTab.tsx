import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  CheckCircle2,
  Activity,
  Layers,
  BarChart2
} from 'lucide-react';
import { NormalizedProduct, HistoricalPricePoint } from '../../types';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';
import {
  calculateMedian,
  calculateMoMPriceChange,
  calculateYoYPriceChange,
  calculateLogPriceVolatility,
  detectPriceEvents,
  calculatePCI,
  calculateRPP,
  PriceBenchmark
} from '../../utils/calculations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

interface PriceTrendsTabProps {
  products: NormalizedProduct[];
  onSelectProduct: (product: NormalizedProduct) => void;
}

const BRAND_PALETTE: Record<string, string> = {
  Colgate: '#991B1B',
  Sensodyne: '#176B4D',
  Closeup: '#D97706',
  Hapee: '#047857',
  'Oral-B': '#1D4ED8',
  OralB: '#1D4ED8',
  Darlie: '#6366F1',
  Glister: '#7C3AED',
  'Market Median': '#737A74'
};

const FALLBACK_COLORS = ['#991B1B', '#176B4D', '#D97706', '#047857', '#6366F1', '#DB2777', '#0D9488'];

export const PriceTrendsTab: React.FC<PriceTrendsTabProps> = ({
  products,
  onSelectProduct
}) => {
  // Find products that have historical price series
  const productsWithHistory = useMemo(() => {
    return products.filter((p) => p.historical_prices && p.historical_prices.length > 1);
  }, [products]);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    productsWithHistory[0]?.product_id || products[0]?.product_id || ''
  );

  const [metricBasis, setMetricBasis] = useState<'shelf_price' | 'unit_price'>('unit_price');

  const activeProduct = useMemo(() => {
    return products.find((p) => p.product_id === selectedProductId) || productsWithHistory[0] || products[0];
  }, [products, selectedProductId, productsWithHistory]);

  const history = useMemo(() => {
    return activeProduct?.historical_prices || [];
  }, [activeProduct]);

  // Overall market median unit price
  const marketMedianUnitPrice = useMemo(() => {
    const validPrices = products.filter((p) => p.price_per_100g > 0).map((p) => p.price_per_100g);
    return calculateMedian(validPrices);
  }, [products]);

  // Hardened Statistical Longitudinal Metrics
  const momResult = useMemo(() => calculateMoMPriceChange(history), [history]);
  const yoyResult = useMemo(() => calculateYoYPriceChange(history), [history]);
  const volatilityResult = useMemo(() => calculateLogPriceVolatility(history), [history]);
  const detectedEvents = useMemo(() => detectPriceEvents(history, 3.0), [history]);

  // Price Competitiveness Index (PCI) and Relative Price Position (RPP)
  const pci = useMemo(() => {
    if (!activeProduct || marketMedianUnitPrice <= 0) return 0;
    return calculatePCI(activeProduct.price_per_100g, marketMedianUnitPrice);
  }, [activeProduct, marketMedianUnitPrice]);

  const rpp = useMemo(() => {
    if (!activeProduct || marketMedianUnitPrice <= 0) return 0;
    return calculateRPP(activeProduct.price_per_100g, marketMedianUnitPrice);
  }, [activeProduct, marketMedianUnitPrice]);

  // Dynamic Longitudinal Multi-Brand Trajectory aggregation
  const { comparativeTimeSeries, trackedBrands, dateCount } = useMemo(() => {
    const dateBrandMap = new Map<string, Map<string, number[]>>();
    const dateMarketMap = new Map<string, number[]>();
    const brandCounts = new Map<string, number>();

    products.forEach((p) => {
      const series = p.historical_prices;
      if (!series || !series.length) return;

      brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + series.length);

      series.forEach((hp) => {
        const d = hp.date;
        if (!d) return;

        if (!dateBrandMap.has(d)) {
          dateBrandMap.set(d, new Map<string, number[]>());
        }
        const bMap = dateBrandMap.get(d)!;
        const bList = bMap.get(p.brand) || [];
        
        const value = metricBasis === 'shelf_price'
          ? hp.price_php
          : p.total_weight_grams > 0
          ? (hp.price_php / p.total_weight_grams) * 100
          : hp.price_php;

        bList.push(value);
        bMap.set(p.brand, bList);

        const mList = dateMarketMap.get(d) || [];
        mList.push(value);
        dateMarketMap.set(d, mList);
      });
    });

    const sortedDates = Array.from(dateBrandMap.keys()).sort();
    const topBrands = Array.from(brandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);

    const seriesData = sortedDates.map((date) => {
      const row: Record<string, string | number | null> = { date };
      topBrands.forEach((brand) => {
        const vals = dateBrandMap.get(date)?.get(brand);
        if (vals && vals.length > 0) {
          row[brand] = Math.round(calculateMedian(vals) * 100) / 100;
        } else {
          row[brand] = null;
        }
      });

      const mVals = dateMarketMap.get(date);
      if (mVals && mVals.length > 0) {
        row['Market Median'] = Math.round(calculateMedian(mVals) * 100) / 100;
      }

      return row;
    });

    return {
      comparativeTimeSeries: seriesData,
      trackedBrands: topBrands,
      dateCount: sortedDates.length
    };
  }, [products, metricBasis]);

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Price Trends & Longitudinal Analysis"
        subtitle="Tracking quarterly shelf prices, log volatility, sequential MoM / YoY shifts, and detected price revisions across Philippine retailers."
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="price_dispersion" label="Learn Volatility" />
            <EvidenceBadge status="Observed" size="md" />
          </div>
        }
      />

      {/* 2. ECONOMETRIC INTERPRETATION NOTICE */}
      <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl text-xs text-[#4F5751] flex items-start gap-3 shadow-2xs font-sans">
        <AlertCircle className="w-4 h-4 text-[#176B4D] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-[#163829] uppercase tracking-wider text-[10px]">
            Econometric Interpretation &amp; Observation Scope
          </div>
          <p className="leading-relaxed">
            Observed price movements reflect point-in-time shelf audits across Philippine supermarkets and pharmacy chains.
            Causal macroeconomic inferences must control for raw input cost dynamics, packaging redesigns, retailer trade margins, and promotional calendars.
          </p>
        </div>
      </div>

      {/* 3. BENCHMARK BRAND TIME SERIES OVERVIEW */}
      <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF0EA] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-serif font-extrabold text-[#163829] tracking-tight">
                Longitudinal Price Trajectory: Category Brands &amp; Benchmark
              </h3>
              <span className="px-2 py-0.5 bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] rounded-md text-[10px] font-bold">
                <span className="font-data">{dateCount}</span> Periods
              </span>
            </div>
            <p className="text-xs text-[#737A74] mt-0.5">
              Category median {metricBasis === 'unit_price' ? 'unit price (₱/100g)' : 'shelf price (₱)'} across top brands vs Market Median
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAFAF7] p-1 border border-[#E3E6DF] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setMetricBasis('unit_price')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                metricBasis === 'unit_price'
                  ? 'bg-[#176B4D] text-white shadow-xs'
                  : 'text-[#737A74] hover:text-[#163829]'
              }`}
            >
              ₱ / 100g Unit Price
            </button>
            <button
              type="button"
              onClick={() => setMetricBasis('shelf_price')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                metricBasis === 'shelf_price'
                  ? 'bg-[#176B4D] text-white shadow-xs'
                  : 'text-[#737A74] hover:text-[#163829]'
              }`}
            >
              Shelf Price (₱)
            </button>
          </div>
        </div>

        {comparativeTimeSeries.length === 0 ? (
          <div className="py-12 text-center text-[#737A74] text-xs">
            No longitudinal price observations found in active dataset.
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparativeTimeSeries} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EA" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#737A74' }} axisLine={{ stroke: '#E3E6DF' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#737A74' }}
                  unit="₱"
                  axisLine={{ stroke: '#E3E6DF' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white text-[#163829] p-3 rounded-xl shadow-card border border-[#E3E6DF] text-xs space-y-1.5 font-sans">
                          <div className="font-bold text-[#163829] text-[11px] pb-1 border-b border-[#EEF0EA]">
                            Observation: <span className="font-data">{label}</span>
                          </div>
                          {payload.map((p, i) => (
                            <div key={i} className="flex justify-between gap-4">
                              <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
                              <strong className="font-data tabular-nums font-bold">
                                ₱{Number(p.value).toFixed(2)}
                                {metricBasis === 'unit_price' ? ' / 100g' : ''}
                              </strong>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                {trackedBrands.map((brand, idx) => (
                  <Line
                    key={brand}
                    type="monotone"
                    dataKey={brand}
                    stroke={BRAND_PALETTE[brand] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3.5 }}
                    connectNulls
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="Market Median"
                  stroke={BRAND_PALETTE['Market Median']}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. INDIVIDUAL SKU HISTORICAL INSPECTOR */}
      {activeProduct && (
        <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF0EA] pb-4">
            <div>
              <div className="text-[10px] font-bold text-[#176B4D] uppercase tracking-wider">
                Product-Level Longitudinal History
              </div>
              <h3 className="text-xl font-serif font-extrabold text-[#163829] mt-0.5">
                {activeProduct.product_name}
              </h3>
              <p className="text-xs text-[#737A74]">
                {activeProduct.variant} &bull; {activeProduct.size_value}
                {activeProduct.size_unit} ({activeProduct.retailer}) &bull; SKU ID:{' '}
                <span className="font-data text-[#176B4D]">{activeProduct.product_id}</span>
              </p>
            </div>

            {/* Product Selector */}
            <div className="w-full sm:w-auto">
              <label htmlFor="select-sku-trend" className="block text-[10px] uppercase tracking-wider text-[#737A74] mb-1 font-bold">
                Select Tracked SKU:
              </label>
              <select
                id="select-sku-trend"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="py-1.5 px-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] font-medium focus:outline-none focus:border-[#176B4D]"
              >
                {productsWithHistory.map((p) => (
                  <option key={p.product_id} value={p.product_id} className="bg-white text-[#163829]">
                    {p.brand} - {p.product_name} ({p.retailer})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hardened Longitudinal Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
              <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold">Current Price</div>
              <div className="text-lg font-data tabular-nums font-bold text-[#163829] mt-0.5">
                ₱{activeProduct.price_php.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#176B4D] font-data font-semibold mt-0.5">
                ₱{activeProduct.price_per_100g.toFixed(2)} / 100g
              </div>
            </div>

            {/* Recent Observed Period Change */}
            <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
              <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold">Recent Shift</div>
              {momResult && momResult.changePct !== null ? (
                <>
                  <div
                    className={`text-lg font-data tabular-nums font-bold mt-0.5 flex items-center gap-0.5 ${
                      momResult.changePct > 0
                        ? 'text-[#B45309]'
                        : momResult.changePct < 0
                        ? 'text-[#176B4D]'
                        : 'text-[#737A74]'
                    }`}
                  >
                    {momResult.changePct > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : momResult.changePct < 0 ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : null}
                    <span>
                      {momResult.changePct > 0
                        ? `+${momResult.changePct.toFixed(1)}%`
                        : `${momResult.changePct.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#737A74] truncate" title={momResult.previousDate ? `from ${momResult.previousDate}` : undefined}>
                    {momResult.previousDate ? `vs ${momResult.previousDate}` : 'Prior snapshot'}
                  </div>
                </>
              ) : (
                <div className="text-xs text-[#737A74] mt-1">N/A (&lt; 2 snapshots)</div>
              )}
            </div>

            {/* 12-Month Net Change */}
            <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
              <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold">12-Mo Change</div>
              {yoyResult && yoyResult.changePct !== null ? (
                <>
                  <div
                    className={`text-lg font-data tabular-nums font-bold mt-0.5 flex items-center gap-0.5 ${
                      yoyResult.changePct > 0
                        ? 'text-[#B45309]'
                        : yoyResult.changePct < 0
                        ? 'text-[#176B4D]'
                        : 'text-[#737A74]'
                    }`}
                  >
                    {yoyResult.changePct > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : yoyResult.changePct < 0 ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : null}
                    <span>
                      {yoyResult.changePct > 0
                        ? `+${yoyResult.changePct.toFixed(1)}%`
                        : `${yoyResult.changePct.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#737A74] truncate" title={yoyResult.baseDate ? `from ${yoyResult.baseDate}` : undefined}>
                    {yoyResult.baseDate ? `vs ${yoyResult.baseDate}` : '~12 mo window'}
                  </div>
                </>
              ) : (
                <div className="text-xs text-[#737A74] mt-1">N/A (No prior-yr)</div>
              )}
            </div>

            {/* Log Return Price Volatility */}
            <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
              <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold">Log Volatility</div>
              {volatilityResult.isValid && volatilityResult.volatilityPercent !== null ? (
                <>
                  <div className="text-lg font-data tabular-nums font-bold text-[#176B4D] mt-0.5">
                    {volatilityResult.volatilityPercent.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-[#737A74]">
                    &sigma; log (n=<span className="font-data">{volatilityResult.observationCount}</span>)
                  </div>
                </>
              ) : (
                <div className="text-xs text-[#737A74] mt-1" title={volatilityResult.statusMessage}>
                  N/A (&lt; 3 points)
                </div>
              )}
            </div>

            {/* Price Competitiveness Index (PCI) */}
            <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
              <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold">Price Index (PCI)</div>
              <div className="text-lg font-data tabular-nums font-bold text-[#163829] mt-0.5">
                {pci.toFixed(1)}
              </div>
              <div className="text-[10px] text-[#737A74]">
                Base 100 = Market
              </div>
            </div>

            {/* Relative Price Position (RPP) */}
            <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
              <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold">Position vs Mkt</div>
              <div
                className={`text-lg font-data tabular-nums font-bold mt-0.5 ${
                  rpp > 0 ? 'text-[#B45309]' : rpp < 0 ? 'text-[#176B4D]' : 'text-[#737A74]'
                }`}
              >
                {rpp > 0 ? `+${rpp.toFixed(1)}%` : `${rpp.toFixed(1)}%`}
              </div>
              <div className="text-[10px] text-[#737A74]">
                {rpp > 0 ? 'Premium' : 'Discount'}
              </div>
            </div>
          </div>

          {/* Historical Observations Table & Price Events Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 border border-[#E3E6DF] rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-[#FAFAF7] px-4 py-3 border-b border-[#E3E6DF] flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-[#163829]">Recorded Observation Snapshots</span>
                <span className="text-[10px] text-[#737A74]"><span className="font-data font-bold">{history.length}</span> audit records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#FAFAF7]/60 border-b border-[#E3E6DF] text-[#737A74] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Snapshot Date</th>
                      <th className="py-2.5 px-3 font-semibold">Retailer</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Recorded Price</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF0EA] text-[#163829]">
                    {history.map((hp, idx) => {
                      const unitPrice =
                        activeProduct.total_weight_grams > 0
                          ? (hp.price_php / activeProduct.total_weight_grams) * 100
                          : 0;
                      return (
                        <tr key={idx} className="hover:bg-[#FAFAF7]">
                          <td className="py-2.5 px-4 font-data text-[#737A74]">{hp.date}</td>
                          <td className="py-2.5 px-3 text-[#163829] font-medium">{hp.retailer}</td>
                          <td className="py-2.5 px-3 text-right font-data tabular-nums font-bold text-[#163829]">
                            ₱{hp.price_php.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#176B4D] font-data tabular-nums font-bold">
                            ₱{unitPrice.toFixed(2)} / 100g
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Discrete Price Shifts Ledger */}
            <div className="border border-[#E3E6DF] rounded-xl overflow-hidden flex flex-col shadow-2xs">
              <div className="bg-[#FAFAF7] px-4 py-3 border-b border-[#E3E6DF] flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-[#163829]">Price Shifts (&ge; 3%)</span>
                <span className="text-[10px] text-[#176B4D] font-bold"><span className="font-data">{detectedEvents.length}</span> events</span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-2 bg-white">
                {detectedEvents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#737A74]">
                    No discrete shifts &ge; 3.0% observed across recorded snapshots.
                  </div>
                ) : (
                  detectedEvents.map((evt, eIdx) => (
                    <div
                      key={eIdx}
                      className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-data text-[11px] text-[#737A74] font-semibold">{evt.date}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-data ${
                            evt.direction === 'INCREASE'
                              ? 'bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5]'
                              : 'bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1]'
                          }`}
                        >
                          {evt.direction === 'INCREASE' ? `+${evt.changePercent.toFixed(1)}%` : `${evt.changePercent.toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#163829] font-data tabular-nums font-medium">
                        ₱{evt.previousPrice.toFixed(2)} &rarr; ₱{evt.newPrice.toFixed(2)} ({evt.priceDelta > 0 ? '+' : ''}₱{evt.priceDelta.toFixed(2)})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
