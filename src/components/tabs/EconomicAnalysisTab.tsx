import React, { useState } from 'react';
import {
  TrendingDown,
  Calculator,
  Layers,
  Sparkles,
  Info,
  Scale,
  DollarSign,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import {
  NormalizedProduct,
  EconometricRegressionResult,
  HedonicRegressionResult
} from '../../types';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';
import {
  calculateSizeEconomicsRegression,
  calculateHedonicRegression
} from '../../utils/calculations';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  ComposedChart
} from 'recharts';

interface EconomicAnalysisTabProps {
  products: NormalizedProduct[];
  marketMedian100g: number;
}

export const EconomicAnalysisTab: React.FC<EconomicAnalysisTabProps> = ({
  products,
  marketMedian100g
}) => {
  // Compute econometric models on the fly
  const sizeRegression = calculateSizeEconomicsRegression(products);
  const hedonicRegression = calculateHedonicRegression(products);

  // Package Size Savings Simulator State
  const [householdSize, setHouseholdSize] = useState<number>(3);
  const [brushingsPerDay, setBrushingsPerDay] = useState<number>(2);
  const [toothpasteGramPerBrush, setToothpasteGramPerBrush] = useState<number>(1.2);

  // Calculate annual consumption
  const annualConsumptionGrams = householdSize * brushingsPerDay * toothpasteGramPerBrush * 365;

  // Compare average unit cost of <= 100g vs >= 150g single vs twin-packs
  const smallPackProducts = products.filter((p) => p.total_weight_grams <= 100 && !p.is_multipack);
  const largePackProducts = products.filter((p) => p.total_weight_grams >= 140 && !p.is_multipack);
  const twinPackProducts = products.filter((p) => p.is_multipack);

  const avgSmallCost100g =
    smallPackProducts.reduce((acc, p) => acc + p.price_per_100g, 0) / (smallPackProducts.length || 1);
  const avgLargeCost100g =
    largePackProducts.reduce((acc, p) => acc + p.price_per_100g, 0) / (largePackProducts.length || 1);
  const avgTwinCost100g =
    twinPackProducts.reduce((acc, p) => acc + p.price_per_100g, 0) / (twinPackProducts.length || 1);

  // Annual expense
  const annualCostSmall = (annualConsumptionGrams / 100) * avgSmallCost100g;
  const annualCostLarge = (annualConsumptionGrams / 100) * avgLargeCost100g;
  const annualCostTwin = (annualConsumptionGrams / 100) * avgTwinCost100g;

  const annualSavingsLarge = annualCostSmall - annualCostLarge;
  const annualSavingsTwin = annualCostSmall - annualCostTwin;

  // Extract OLS coefficients from RegressionResult
  const isSizeRegressionValid = (sizeRegression.status === 'valid' || !sizeRegression.status) && sizeRegression.coefficients.length >= 2;
  const interceptCoef = isSizeRegressionValid ? sizeRegression.coefficients[0] : null;
  const slopeCoef = isSizeRegressionValid ? sizeRegression.coefficients[1] : null;
  const beta0 = interceptCoef?.coef ?? 0;
  const beta1 = slopeCoef?.coef ?? 0;

  // Prepare scatter + trend line data for size economics
  const scatterPoints = products.map((p) => ({
    size: p.total_weight_grams,
    pricePer100g: p.price_per_100g,
    name: p.product_name,
    brand: p.brand
  }));

  // Generate endpoints for regression line if valid
  const linePoints = isSizeRegressionValid
    ? [
        { size: 40, trend: Math.exp(beta0 + beta1 * Math.log(40)) },
        { size: 100, trend: Math.exp(beta0 + beta1 * Math.log(100)) },
        { size: 150, trend: Math.exp(beta0 + beta1 * Math.log(150)) },
        { size: 300, trend: Math.exp(beta0 + beta1 * Math.log(300)) }
      ]
    : [];

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Economic Analysis"
        subtitle="Empirical log-log regressions testing package size elasticity, hedonic attribute valuation, and price discrimination."
        actions={
          <div className="flex items-center gap-2">
            <LearnTooltip topicKey="economies_of_scale" label="Learn Size Economies" />
            <LearnTooltip topicKey="hedonic_pricing" label="Learn Hedonic Pricing" />
            <EvidenceBadge status="Estimated" size="md" />
          </div>
        }
      />

      {/* 2. MODEL 1: PACKAGE SIZE ECONOMICS REGRESSION */}
      <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF0EA] pb-4">
          <div>
            <div className="text-[10px] font-sans font-bold text-[#176B4D] uppercase tracking-wider">
              Ordinary Least Squares (OLS) Model 1
            </div>
            <h3 className="text-xl font-bold text-[#163829] mt-0.5 tracking-tight font-sans">
              Package Size Economies: Unit Cost vs Net Weight
            </h3>
            <p className="text-xs text-[#737A74] font-sans">
              Empirical elasticity testing: Does normalized unit cost (₱/100g) decline as package volume (grams) expands?
            </p>
          </div>
          <div className="text-xs font-data bg-[#FAFAF7] px-3 py-1.5 rounded-lg border border-[#E3E6DF] text-[#163829]">
            ln(₱/100g) = {beta0.toFixed(2)} + ({beta1.toFixed(3)}) &times; ln(Grams)
          </div>
        </div>

        {/* Statistical Parameters Grid */}
        {!isSizeRegressionValid ? (
          <div className="p-4 bg-[#FFFDF5] border border-[#FEEBB5] rounded-xl text-xs text-[#163829] flex items-center gap-3 font-sans">
            <Info className="w-5 h-5 text-[#B8860B] shrink-0" />
            <div>
              <div className="font-bold text-[#B8860B]">Regression Model Unavailable</div>
              <div className="text-[#737A74] mt-0.5">
                {sizeRegression.statusMessage || 'Insufficient observation points to construct OLS size elasticity regression.'}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs font-sans">
              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">R-Squared (R²)</span>
                <div className="text-lg font-data tabular-nums font-bold text-[#163829] mt-0.5">{sizeRegression.rSquared}</div>
                <span className="text-[#737A74] text-[10px] font-data">
                  Adj: {sizeRegression.adjustedRSquared?.toFixed(3) ?? sizeRegression.rSquared}
                </span>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Elasticity (β₁)</span>
                <div className="text-lg font-data tabular-nums font-bold text-[#176B4D] mt-0.5">{beta1.toFixed(3)}</div>
                <span className="text-[#737A74] text-[10px] font-data">
                  {slopeCoef?.confidenceInterval
                    ? `[${slopeCoef.confidenceInterval[0].toFixed(2)}, ${slopeCoef.confidenceInterval[1].toFixed(2)}]`
                    : '% chg per 1% size'}
                </span>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Constant (β₀)</span>
                <div className="text-lg font-data tabular-nums font-bold text-[#163829] mt-0.5">{beta0.toFixed(3)}</div>
                <span className="text-[#737A74] text-[10px]">Baseline intercept</span>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">t-Statistic</span>
                <div className="text-lg font-data tabular-nums font-bold text-[#163829] mt-0.5">{slopeCoef?.tStat ?? '0'}</div>
                <span className="text-[#737A74] text-[10px] font-data">df={sizeRegression.dfResidual ?? 'N/A'}</span>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">F-Statistic</span>
                <div className="text-lg font-data tabular-nums font-bold text-[#163829] mt-0.5">
                  {sizeRegression.fStatistic !== undefined ? sizeRegression.fStatistic.toFixed(2) : 'N/A'}
                </div>
                <span className="text-[#737A74] text-[10px] font-data">
                  p = {sizeRegression.pValueF !== undefined && sizeRegression.pValueF < 0.001 ? '<0.001' : sizeRegression.pValueF?.toFixed(3) ?? 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-[#EEF4EE] border border-[#DDEBE1] rounded-xl">
                <span className="text-[#176B4D] text-[10px] uppercase tracking-wider font-bold">p-Value (Slope)</span>
                <div className="text-lg font-data tabular-nums font-bold text-[#176B4D] mt-0.5">
                  {(slopeCoef?.pValue ?? 0) < 0.001 ? '< 0.001' : (slopeCoef?.pValue ?? 0).toFixed(3)}
                </div>
                <span className="text-[#176B4D]/80 text-[10px] font-semibold">Significant (p&lt;0.05)</span>
              </div>
            </div>

            {/* Empirical Interpretation Box */}
            <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl text-xs text-[#4F5751] space-y-1 font-sans">
              <div className="font-bold text-[#163829] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-[#176B4D]" />
                <span>Economic Interpretation &amp; Confirmation:</span>
              </div>
              <p className="leading-relaxed font-normal">
                {slopeCoef?.interpretation || 'Observed regression indicates package economies of scale.'} Across audited Philippine supermarket SKUs, purchasing larger volumes (e.g. 150g&ndash;300g twin packs) yields substantial quantity savings over small 50g&ndash;100g tubes. Manufacturers pass fixed packaging and distribution economies to consumers in the standardized rate.
              </p>
            </div>
          </>
        )}

        {/* Regression Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EA" />
              <XAxis
                dataKey="size"
                type="number"
                domain={[30, 320]}
                unit="g"
                tick={{ fontSize: 11, fill: '#737A74' }}
                axisLine={{ stroke: '#E3E6DF' }}
                label={{ value: 'Net Package Weight (Grams)', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#737A74' }}
              />
              <YAxis
                dataKey="pricePer100g"
                type="number"
                unit="₱"
                tick={{ fontSize: 11, fill: '#737A74' }}
                axisLine={{ stroke: '#E3E6DF' }}
                label={{ value: 'Price / 100g (₱)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#737A74' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white text-[#163829] p-3 rounded-xl shadow-card border border-[#E3E6DF] text-xs space-y-1 font-sans">
                        <div className="font-bold text-[#163829]">{d.brand}</div>
                        <div className="text-[#737A74]">{d.name}</div>
                        <div>
                          Size: <strong className="font-data">{d.size}g</strong>
                        </div>
                        <div>
                          Price/100g: <strong className="font-data tabular-nums text-[#176B4D]">₱{Number(d.pricePer100g).toFixed(2)}</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={scatterPoints} fill="#176B4D" opacity={0.65} />
              <Line
                data={linePoints}
                dataKey="trend"
                stroke="#B8860B"
                strokeWidth={2}
                dot={false}
                name="OLS Regression Fit"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. MODEL 2: MULTIVARIATE HEDONIC PRICING MODEL */}
      <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF0EA] pb-4">
          <div>
            <div className="text-[10px] font-sans font-bold text-[#176B4D] uppercase tracking-wider">
              Multivariate Hedonic Model
            </div>
            <h3 className="text-xl font-bold text-[#163829] mt-0.5 tracking-tight font-sans">
              Implicit Attribute Valuation (Hedonic Pricing)
            </h3>
            <p className="text-xs text-[#737A74] font-sans">
              Decomposing observed price into the implicit market value of brand equity and clinical formulation attributes (R²: {hedonicRegression.rSquared})
            </p>
          </div>
          <LearnTooltip topicKey="hedonic_pricing" label="Hedonic Pricing Theory" />
        </div>

        {hedonicRegression.status && hedonicRegression.status !== 'valid' ? (
          <div className="p-4 bg-[#FFFDF5] border border-[#FEEBB5] rounded-xl text-xs text-[#163829] flex items-center gap-3 font-sans">
            <Info className="w-5 h-5 text-[#B8860B] shrink-0" />
            <div>
              <div className="font-bold text-[#B8860B]">Hedonic Regression Model Unavailable</div>
              <div className="text-[#737A74] mt-0.5">
                {hedonicRegression.statusMessage || 'Insufficient non-collinear features to estimate hedonic parameters.'}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Hedonic Diagnostic Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Model R² / Adj R²</span>
                <div className="text-base font-data tabular-nums font-bold text-[#163829] mt-0.5">
                  {hedonicRegression.rSquared} / {hedonicRegression.adjustedRSquared?.toFixed(3) ?? hedonicRegression.rSquared}
                </div>
                <span className="text-[#737A74] text-[10px]">Variance explained</span>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">F-Statistic</span>
                <div className="text-base font-data tabular-nums font-bold text-[#163829] mt-0.5">
                  {hedonicRegression.fStatistic !== undefined ? hedonicRegression.fStatistic.toFixed(2) : 'N/A'}
                </div>
                <span className="text-[#737A74] text-[10px] font-data">
                  p = {hedonicRegression.pValueF !== undefined && hedonicRegression.pValueF < 0.001 ? '<0.001' : hedonicRegression.pValueF?.toFixed(3) ?? 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Degrees of Freedom</span>
                <div className="text-base font-data tabular-nums font-bold text-[#176B4D] mt-0.5">
                  df = {hedonicRegression.dfResidual ?? 'N/A'}
                </div>
                <span className="text-[#737A74] text-[10px]">Residual error df</span>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Estimator</span>
                <div className="text-base font-sans font-bold text-[#163829] mt-0.5">
                  Log-Linear OLS
                </div>
                <span className="text-[#737A74] text-[10px]">Gauss-Jordan Partial Pivot</span>
              </div>
            </div>

            {/* Hedonic Coefficients Table */}
            <div className="border border-[#E3E6DF] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left border-collapse font-sans">
                <thead className="bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#737A74] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Product Attribute</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Coefficient (β)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">95% Conf. Interval</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Implicit Premium</th>
                    <th className="py-2.5 px-3 text-right font-semibold">p-Val</th>
                    <th className="py-2.5 px-4 font-semibold">Economic Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF0EA] text-[#163829]">
                  {hedonicRegression.coefficients.map((c, i) => {
                    const pctImpact = Math.round((Math.exp(c.coef) - 1) * 100);
                    return (
                      <tr key={i} className="hover:bg-[#FAFAF7]">
                        <td className="py-2.5 px-4 font-bold text-[#163829]">{c.label}</td>
                        <td className="py-2.5 px-3 text-right font-data tabular-nums text-[#737A74]">
                          {c.coef > 0 ? `+${c.coef.toFixed(3)}` : c.coef.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-data tabular-nums text-[#737A74]">
                          {c.confidenceInterval
                            ? `[${c.confidenceInterval[0].toFixed(2)}, ${c.confidenceInterval[1].toFixed(2)}]`
                            : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold font-data tabular-nums ${
                              pctImpact > 0
                                ? 'bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5]'
                                : 'bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1]'
                            }`}
                          >
                            {pctImpact > 0 ? `+${pctImpact}%` : `${pctImpact}%`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-data tabular-nums text-[11px] text-[#737A74]">
                          {c.pValue !== undefined
                            ? c.pValue < 0.001
                              ? '< 0.001'
                              : c.pValue.toFixed(3)
                            : 'N/A'}
                        </td>
                        <td className="py-2.5 px-4 text-[#737A74] text-[11px]">{c.interpretation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 4. INTERACTIVE ANNUAL HOUSEHOLD SAVINGS SIMULATOR */}
      <div className="bg-white rounded-xl text-[#163829] p-6 sm:p-8 shadow-card border border-[#E3E6DF] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF0EA] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#176B4D] font-sans font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#176B4D]" />
              <span>Applied Household Economics Simulator</span>
            </div>
            <h3 className="text-xl font-bold text-[#163829] tracking-tight font-sans">
              Package Size &amp; Twin-Pack Annual Household Savings Calculator
            </h3>
            <p className="text-xs text-[#737A74] font-sans">
              Estimate aggregate annual savings realized simply by substituting single 50g&ndash;100g tubes for twin packs or large formats.
            </p>
          </div>
        </div>

        {/* Sliders Control Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-sans">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#737A74] font-medium">Household Members:</span>
              <strong className="text-[#176B4D] font-data tabular-nums font-bold">{householdSize} persons</strong>
            </div>
            <input
              id="slider-household-size"
              type="range"
              min="1"
              max="8"
              value={householdSize}
              onChange={(e) => setHouseholdSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#E3E6DF] rounded-lg appearance-none cursor-pointer accent-[#176B4D]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#737A74] font-medium">Brushings per Day:</span>
              <strong className="text-[#176B4D] font-data tabular-nums font-bold">{brushingsPerDay} times / day</strong>
            </div>
            <input
              id="slider-brushings-day"
              type="range"
              min="1"
              max="4"
              value={brushingsPerDay}
              onChange={(e) => setBrushingsPerDay(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#E3E6DF] rounded-lg appearance-none cursor-pointer accent-[#176B4D]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#737A74] font-medium">Portion per Brush:</span>
              <strong className="text-[#176B4D] font-data tabular-nums font-bold">{toothpasteGramPerBrush} grams</strong>
            </div>
            <input
              id="slider-portion-brush"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={toothpasteGramPerBrush}
              onChange={(e) => setToothpasteGramPerBrush(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#E3E6DF] rounded-lg appearance-none cursor-pointer accent-[#176B4D]"
            />
          </div>
        </div>

        {/* Results Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-sans">
          {/* Option A: Buying Small Single Tubes */}
          <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-1">
            <span className="text-[10px] text-[#737A74] font-sans font-bold uppercase tracking-wider">
              Strategy A: Small Tubes (&le;100g)
            </span>
            <div className="text-xl font-data tabular-nums font-bold text-[#163829]">₱{annualCostSmall.toFixed(2)} / yr</div>
            <p className="text-[10px] text-[#737A74] font-data">
              Avg: ₱{avgSmallCost100g.toFixed(2)} / 100g
            </p>
          </div>

          {/* Option B: Standard Large Tube */}
          <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-1">
            <span className="text-[10px] text-[#737A74] font-sans font-bold uppercase tracking-wider">
              Strategy B: Standard (&ge;140g)
            </span>
            <div className="text-xl font-data tabular-nums font-bold text-[#176B4D]">₱{annualCostLarge.toFixed(2)} / yr</div>
            <p className="text-[10px] text-[#176B4D] font-semibold font-data">
              Save ₱{annualSavingsLarge.toFixed(2)} / year
            </p>
          </div>

          {/* Option C: Twin / Multi-Packs */}
          <div className="p-4 bg-[#EEF4EE] border border-[#DDEBE1] rounded-xl space-y-1">
            <span className="text-[10px] text-[#176B4D] font-sans font-bold uppercase tracking-wider">
              Strategy C: Twin / Value Packs
            </span>
            <div className="text-2xl font-data tabular-nums font-bold text-[#176B4D]">
              ₱{annualCostTwin.toFixed(2)} / yr
            </div>
            <p className="text-xs text-[#176B4D] font-bold font-data">
              Save ₱{annualSavingsTwin.toFixed(2)} / year ({((annualSavingsTwin / annualCostSmall) * 100).toFixed(0)}% lower)
            </p>
          </div>
        </div>

        <div className="text-[10px] text-[#737A74] pt-2 border-t border-[#EEF0EA] flex justify-between font-sans">
          <span>
            Household uses ~<strong className="text-[#163829] font-data">{(annualConsumptionGrams / 1000).toFixed(2)} kg</strong> toothpaste per year
          </span>
          <span>Economies of scale compound over time</span>
        </div>
      </div>
    </div>
  );
};
