/**
 * THE GROCER - Statistical & Longitudinal Analytics Hardening Engine
 * 
 * Provides mathematically defensible, reproducible, and transparent statistical functions:
 * - Student's t-distribution (exact two-tailed p-values & critical values via incomplete beta function)
 * - F-distribution p-values
 * - Reusable objective price metrics (PCI, RPP, Promotion Depth, Promotion Frequency, Retailer Price Index)
 * - Explicit benchmark abstraction (Total Market Median, Brand Portfolio Median, Sub-segment Median, Tier Median)
 * - Defensible sequential price volatility based on log price changes (ln(P_t / P_{t-1}))
 * - Longitudinal period aggregation, MoM & YoY change calculations (with missing-data guardrails)
 * - Discrete PriceEvent extraction
 * - Matrix OLS solver with full diagnostics (R², Adj R², SE, F-stat, t-stat, p-values, condition/singularity checks)
 */

import { EvidenceStatus } from './types';

// ==========================================
// 1. SPECIAL FUNCTIONS & STUDENT-T INFERENCE
// ==========================================

/**
 * Natural logarithm of the Gamma function ln(Γ(x))
 * Lanczos approximation (accuracy > 1e-12 for x > 0)
 */
export function logGamma(x: number): number {
  if (x <= 0) return 0;
  const cof = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j <= 5; j++) {
    ser += cof[j] / ++y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/**
 * Continued fraction evaluation for regularized incomplete beta function
 */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 100;
  const EPS = 3.0e-7;
  const FPMIN = 1.0e-30;
  const qab = a + b;
  const qap = a + 1.0;
  const qam = a - 1.0;
  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    h *= d * c;

    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < EPS) break;
  }
  return h;
}

/**
 * Regularized Incomplete Beta Function I_x(a, b)
 */
export function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x < 0.0 || x > 1.0) return x < 0.0 ? 0.0 : 1.0;
  if (x === 0.0) return 0.0;
  if (x === 1.0) return 1.0;

  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1.0 - x)
  );

  if (x < (a + 1.0) / (a + b + 2.0)) {
    return (bt * betacf(a, b, x)) / a;
  } else {
    return 1.0 - (bt * betacf(b, a, 1.0 - x)) / b;
  }
}

/**
 * Two-tailed p-value for Student's t distribution with df degrees of freedom
 * P(|T| >= |t|) = I_{df / (df + t^2)}(df / 2, 1 / 2)
 */
export function studentTPValue(t: number, df: number): number {
  if (df <= 0 || isNaN(df) || isNaN(t)) return 1.0;
  const absT = Math.abs(t);
  if (absT === 0) return 1.0;
  const x = df / (df + absT * absT);
  const p = regularizedIncompleteBeta(0.5 * df, 0.5, x);
  return Math.max(0, Math.min(1.0, p));
}

/**
 * Cumulative Distribution Function (CDF) for Student's t distribution
 * F(t; df) = P(T <= t)
 */
export function studentTCDF(t: number, df: number): number {
  if (df <= 0) return 0.5;
  if (t === 0) return 0.5;
  const pVal = studentTPValue(t, df);
  return t > 0 ? 1 - 0.5 * pVal : 0.5 * pVal;
}

/**
 * Calculates two-tailed critical value t_crit such that P(|T| >= t_crit) = alpha
 * for Student's t distribution with df degrees of freedom.
 * Uses exact closed-form solutions for df=1 and df=2, and high-precision bisection for general df.
 */
export function studentTCriticalValue(df: number, alpha: number = 0.05): number {
  if (df <= 0 || isNaN(df)) return NaN;
  if (alpha <= 0 || alpha >= 1) return NaN;

  // Support both significance level alpha (e.g. 0.05) and confidence level (e.g. 0.95)
  const effectiveAlpha = alpha > 0.5 ? 1 - alpha : alpha;

  // Exact for df = 1 (Cauchy): tan(pi * (1 - alpha) / 2)
  if (df === 1) {
    return Math.tan((Math.PI * (1 - effectiveAlpha)) / 2);
  }
  // Exact for df = 2:
  if (df === 2) {
    const p1 = 1 - effectiveAlpha;
    return Math.sqrt((2 * p1 * p1) / (1 - p1 * p1));
  }

  // Bisection solver on studentTPValue(t, df) = effectiveAlpha
  let low = 0;
  let high = 50;
  for (let iter = 0; iter < 60; iter++) {
    const mid = (low + high) / 2;
    const p = studentTPValue(mid, df);
    if (p > effectiveAlpha) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

/**
 * Upper-tail p-value for Fisher-Snedecor F-distribution with df1, df2 degrees of freedom
 * P(F >= f) = I_{df2 / (df2 + df1 * f)}(df2 / 2, df1 / 2)
 */
export function fDistributionPValue(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0 || isNaN(f)) return 1.0;
  const x = df2 / (df2 + df1 * f);
  return regularizedIncompleteBeta(0.5 * df2, 0.5 * df1, x);
}

/**
 * Calculates two-sided confidence interval for a sample mean using Student's t critical value
 */
export interface ConfidenceIntervalResult {
  mean: number;
  ciLower: number | null;
  ciUpper: number | null;
  standardError: number;
  tCritical: number;
  df: number;
  isReliable: boolean;
  sampleSize: number;
}

export function calculateConfidenceInterval(
  mean: number,
  stdDev: number,
  n: number,
  confidenceLevel: number = 0.95
): ConfidenceIntervalResult {
  if (n < 2 || stdDev < 0 || isNaN(mean) || isNaN(stdDev)) {
    return {
      mean,
      ciLower: null,
      ciUpper: null,
      standardError: 0,
      tCritical: NaN,
      df: Math.max(0, n - 1),
      isReliable: false,
      sampleSize: n
    };
  }

  const df = n - 1;
  const alpha = 1 - confidenceLevel;
  const tCrit = studentTCriticalValue(df, alpha);
  const se = stdDev / Math.sqrt(n);
  const marginOfError = tCrit * se;

  return {
    mean,
    ciLower: Math.max(0, mean - marginOfError),
    ciUpper: mean + marginOfError,
    standardError: se,
    tCritical: tCrit,
    df,
    isReliable: true,
    sampleSize: n
  };
}

// ==========================================
// 2. OBJECTIVE ENTERPRISE PRICE METRICS
// ==========================================

/**
 * Price Competitiveness Index (PCI)
 * Formula: (SKU Price / Benchmark Price) * 100
 * 
 * Interpretation:
 * - 100 = parity with benchmark
 * - > 100 = premium vs benchmark (e.g. 115 = 15% more expensive)
 * - < 100 = discount vs benchmark (e.g. 85 = 15% cheaper)
 */
export function calculatePCI(skuPrice: number, benchmarkPrice: number): number | null {
  if (benchmarkPrice <= 0 || skuPrice < 0 || isNaN(skuPrice) || isNaN(benchmarkPrice)) {
    return null;
  }
  return (skuPrice / benchmarkPrice) * 100;
}

/**
 * Relative Price Position (RPP)
 * Formula: ((SKU Price - Benchmark Price) / Benchmark Price) * 100
 * 
 * Interpretation:
 * - 0% = parity with benchmark
 * - +X% = percentage premium above benchmark
 * - -X% = percentage discount below benchmark
 */
export function calculateRPP(skuPrice: number, benchmarkPrice: number): number | null {
  if (benchmarkPrice <= 0 || skuPrice < 0 || isNaN(skuPrice) || isNaN(benchmarkPrice)) {
    return null;
  }
  return ((skuPrice - benchmarkPrice) / benchmarkPrice) * 100;
}

/**
 * Promotion Depth
 * Formula: ((Regular Price - Promotional Price) / Regular Price) * 100
 * 
 * Preconditions:
 * - regularPrice must be strictly positive (> 0)
 * - promotionalPrice must be strictly positive and <= regularPrice
 * - If regularPrice is missing or zero, returns null
 */
export function calculatePromotionDepth(regularPrice: number, promotionalPrice: number): number | null {
  if (regularPrice <= 0 || promotionalPrice <= 0 || promotionalPrice > regularPrice || isNaN(regularPrice) || isNaN(promotionalPrice)) {
    return null;
  }
  return ((regularPrice - promotionalPrice) / regularPrice) * 100;
}

/**
 * Promotion Frequency
 * Formula: Promotional Observations / Total Valid Observations
 * 
 * Represents the observational rate of promotional pricing across collected shelf snapshots.
 * Note: Clearly distinct from promotional duration.
 */
export function calculatePromotionFrequency(promoCount: number, totalObservations: number): number | null {
  if (totalObservations <= 0 || promoCount < 0 || promoCount > totalObservations || isNaN(promoCount) || isNaN(totalObservations)) {
    return null;
  }
  return promoCount / totalObservations;
}

/**
 * Retailer Price Index (RPI)
 * Formula: (Retailer Benchmark Price / Market Benchmark Price) * 100
 */
export function calculateRetailerPriceIndex(retailerBenchmark: number, marketBenchmark: number): number | null {
  if (marketBenchmark <= 0 || retailerBenchmark <= 0 || isNaN(retailerBenchmark) || isNaN(marketBenchmark)) {
    return null;
  }
  return (retailerBenchmark / marketBenchmark) * 100;
}

// ==========================================
// 3. EXPLICIT PRICE BENCHMARKS
// ==========================================

export type BenchmarkType = 
  | 'total_market_median' 
  | 'brand_portfolio_median' 
  | 'subsegment_median' 
  | 'positioning_tier_median' 
  | 'custom';

export interface PriceBenchmark {
  benchmark_id: string;
  benchmark_name: string;
  benchmark_type: BenchmarkType;
  target_segment?: string;
  unit_price_100g: number;
  sample_size: number;
  description: string;
}

export function createBenchmark(
  id: string,
  name: string,
  type: BenchmarkType,
  unitPrice100g: number,
  sampleSize: number,
  description: string,
  targetSegment?: string
): PriceBenchmark {
  return {
    benchmark_id: id,
    benchmark_name: name,
    benchmark_type: type,
    target_segment: targetSegment,
    unit_price_100g: unitPrice100g,
    sample_size: sampleSize,
    description
  };
}

function calculateMedianHelper(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function getMarketMedianBenchmark(
  items: { price_per_100g: number }[]
): PriceBenchmark {
  const prices = items.map((p) => p.price_per_100g).filter((p) => p > 0);
  const median = calculateMedianHelper(prices);
  return createBenchmark(
    'benchmark-total-market-median',
    'Total Market Median',
    'total_market_median',
    Math.round(median * 100) / 100,
    prices.length,
    `Market-wide median unit price across ${prices.length} observed SKUs.`
  );
}

export function getBrandPortfolioBenchmark(
  items: { price_per_100g: number; brand: string }[],
  brand: string
): PriceBenchmark | null {
  const brandItems = items.filter((p) => p.brand.toLowerCase() === brand.toLowerCase() && p.price_per_100g > 0);
  if (brandItems.length === 0) return null;
  const prices = brandItems.map((p) => p.price_per_100g);
  const median = calculateMedianHelper(prices);
  return createBenchmark(
    `benchmark-brand-${brand.toLowerCase()}`,
    `${brand} Portfolio Median`,
    'brand_portfolio_median',
    Math.round(median * 100) / 100,
    brandItems.length,
    `Median unit price for brand "${brand}" across ${brandItems.length} observed SKUs.`,
    brand
  );
}

export function getSubsegmentBenchmark(
  items: { price_per_100g: number; sub_category: string }[],
  subCategory: string
): PriceBenchmark | null {
  const subItems = items.filter((p) => p.sub_category.toLowerCase() === subCategory.toLowerCase() && p.price_per_100g > 0);
  if (subItems.length === 0) return null;
  const prices = subItems.map((p) => p.price_per_100g);
  const median = calculateMedianHelper(prices);
  return createBenchmark(
    `benchmark-subsegment-${subCategory.toLowerCase()}`,
    `${subCategory} Segment Median`,
    'subsegment_median',
    Math.round(median * 100) / 100,
    subItems.length,
    `Median unit price within sub-category segment "${subCategory}" across ${subItems.length} SKUs.`,
    subCategory
  );
}

export function getPositioningTierBenchmark(
  items: { price_per_100g: number; premium_positioning: string }[],
  tier: string
): PriceBenchmark | null {
  const tierItems = items.filter((p) => p.premium_positioning.toLowerCase() === tier.toLowerCase() && p.price_per_100g > 0);
  if (tierItems.length === 0) return null;
  const prices = tierItems.map((p) => p.price_per_100g);
  const median = calculateMedianHelper(prices);
  return createBenchmark(
    `benchmark-tier-${tier.toLowerCase()}`,
    `${tier} Tier Median`,
    'positioning_tier_median',
    Math.round(median * 100) / 100,
    tierItems.length,
    `Median unit price across products positioned in "${tier}" tier (${tierItems.length} SKUs).`,
    tier
  );
}

// ==========================================
// 4. PRICE VOLATILITY (LOG PRICE CHANGES)
// ==========================================

export interface PriceVolatilityResult {
  volatility: number | null; // sample standard deviation of log returns
  observationCount: number;
  returnCount: number;
  meanLogReturn: number | null;
  status: 'valid' | 'insufficient_observations' | 'constant_price';
  explanation: string;
}

/**
 * Calculates defensible price volatility using log price changes:
 * r_t = ln(P_t / P_{t-1})
 * 
 * Mathematically defensible for retail price time-series:
 * - Requires at least 2 consecutive log-returns (>= 3 sequential chronological observations)
 *   so that sample standard deviation with (N-1) degrees of freedom has N-1 >= 1.
 * - Does not mix unrelated SKUs.
 * - Returns null when observations are insufficient.
 */
export function calculateLogPriceVolatility(
  observations: { date: string; price: number }[]
): PriceVolatilityResult {
  // Sort strictly chronologically
  const sorted = [...observations]
    .filter((o) => o.price > 0 && !isNaN(o.price) && Boolean(o.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length < 3) {
    return {
      volatility: null,
      observationCount: sorted.length,
      returnCount: Math.max(0, sorted.length - 1),
      meanLogReturn: null,
      status: 'insufficient_observations',
      explanation: `Requires >= 3 sequential observations to compute sample standard deviation of log changes (current: ${sorted.length}).`
    };
  }

  // Calculate sequential log returns: r_t = ln(P_t / P_{t-1})
  const logReturns: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const pPrev = sorted[i - 1].price;
    const pCurr = sorted[i].price;
    logReturns.push(Math.log(pCurr / pPrev));
  }

  const N = logReturns.length; // N >= 2
  const meanLogReturn = logReturns.reduce((sum, r) => sum + r, 0) / N;

  // Check if all returns are zero (price was completely constant)
  const isConstant = logReturns.every((r) => Math.abs(r) < 1e-9);
  if (isConstant) {
    return {
      volatility: 0,
      observationCount: sorted.length,
      returnCount: N,
      meanLogReturn: 0,
      status: 'constant_price',
      explanation: 'Price remained unchanged across all observed snapshots.'
    };
  }

  // Sample variance with N - 1 degrees of freedom
  const sumSquaredDev = logReturns.reduce((sum, r) => sum + Math.pow(r - meanLogReturn, 2), 0);
  const sampleVariance = sumSquaredDev / (N - 1);
  const sampleStdDev = Math.sqrt(sampleVariance);

  return {
    volatility: sampleStdDev,
    observationCount: sorted.length,
    returnCount: N,
    meanLogReturn,
    status: 'valid',
    explanation: `Sample standard deviation of ${N} sequential log returns.`
  };
}

// ==========================================
// 5. LONGITUDINAL PRICE EVENTS & AGGREGATION
// ==========================================

export interface PriceEvent {
  event_id: string;
  sku_id: string;
  product_name: string;
  retailer_id: string;
  retailer_name: string;
  previous_price: number;
  new_price: number;
  absolute_change: number;
  percentage_change: number;
  effective_date: string;
  direction: 'increase' | 'decrease' | 'unchanged' | 'INCREASE' | 'DECREASE' | 'UNCHANGED';
  promotion_status: boolean;
  evidence_status: EvidenceStatus;
  // Backward and ergonomic aliases
  date?: string;
  previousPrice?: number;
  newPrice?: number;
  priceDelta?: number;
  changePercent?: number;
}

/**
 * Extracts discrete PriceEvents across sequential observation records for a listing
 */
export function detectPriceEvents(
  observations: Array<{
    sku_id?: string;
    product_name?: string;
    retailer_id?: string;
    retailer_name?: string;
    shelf_price?: number;
    observed_date?: string;
    is_promotional?: boolean;
    evidence_status?: EvidenceStatus;
    // HistoricalPricePoint compatibility
    date?: string;
    price_php?: number;
    retailer?: string;
  }>,
  minThresholdPct: number = 0
): Array<PriceEvent & {
  date: string;
  previousPrice: number;
  newPrice: number;
  priceDelta: number;
  changePercent: number;
  direction: 'increase' | 'decrease' | 'unchanged' | 'INCREASE' | 'DECREASE' | 'UNCHANGED';
}> {
  // Normalize input observation records
  const normalizedObs = observations.map((obs, idx) => ({
    sku_id: obs.sku_id || 'sku-default',
    product_name: obs.product_name || 'Product',
    retailer_id: obs.retailer_id || obs.retailer || 'retailer-default',
    retailer_name: obs.retailer_name || obs.retailer || 'Retailer',
    shelf_price: obs.shelf_price !== undefined ? obs.shelf_price : (obs.price_php ?? 0),
    observed_date: obs.observed_date || obs.date || new Date().toISOString().split('T')[0],
    is_promotional: Boolean(obs.is_promotional),
    evidence_status: obs.evidence_status || 'Observed'
  }));

  // Group by SKU + Retailer
  const listingMap = new Map<string, typeof normalizedObs>();
  normalizedObs.forEach((obs) => {
    const key = `${obs.sku_id}:::${obs.retailer_id}`;
    if (!listingMap.has(key)) {
      listingMap.set(key, []);
    }
    listingMap.get(key)!.push(obs);
  });

  const events: Array<PriceEvent & {
    date: string;
    previousPrice: number;
    newPrice: number;
    priceDelta: number;
    changePercent: number;
    direction: 'increase' | 'decrease' | 'unchanged' | 'INCREASE' | 'DECREASE' | 'UNCHANGED';
  }> = [];

  listingMap.forEach((obsList) => {
    // Sort chronologically
    obsList.sort((a, b) => new Date(a.observed_date).getTime() - new Date(b.observed_date).getTime());

    for (let i = 1; i < obsList.length; i++) {
      const prev = obsList[i - 1];
      const curr = obsList[i];

      const absChange = curr.shelf_price - prev.shelf_price;
      const pctChange = prev.shelf_price > 0 ? (absChange / prev.shelf_price) * 100 : 0;

      // Filter by minimum threshold if specified
      if (minThresholdPct > 0 && Math.abs(pctChange) < minThresholdPct) {
        continue;
      }

      let direction: 'INCREASE' | 'DECREASE' | 'UNCHANGED' = 'UNCHANGED';
      if (absChange > 0.001) direction = 'INCREASE';
      else if (absChange < -0.001) direction = 'DECREASE';

      const roundedAbs = Math.round(absChange * 100) / 100;
      const roundedPct = Math.round(pctChange * 10) / 10;

      events.push({
        event_id: `pevt-${curr.sku_id}-${curr.retailer_id}-${curr.observed_date}`,
        sku_id: curr.sku_id,
        product_name: curr.product_name,
        retailer_id: curr.retailer_id,
        retailer_name: curr.retailer_name,
        previous_price: prev.shelf_price,
        new_price: curr.shelf_price,
        absolute_change: roundedAbs,
        percentage_change: roundedPct,
        effective_date: curr.observed_date,
        direction,
        promotion_status: curr.is_promotional,
        evidence_status: curr.evidence_status,
        // Aliases for UI ergonomics
        date: curr.observed_date,
        previousPrice: prev.shelf_price,
        newPrice: curr.shelf_price,
        priceDelta: roundedAbs,
        changePercent: Math.abs(roundedPct)
      });
    }
  });

  return events;
}

/**
 * Period Price Change (Month-over-Month or sequential period)
 * Compares current observation to the immediate prior observation (typically 1 month or 1 period prior).
 * Returns null if no valid prior observation exists.
 */
export function calculateMoMPriceChange(
  series: { date: string; price: number }[]
): { changePct: number | null; absoluteChange: number | null; previousDate?: string; currentDate?: string } {
  const sorted = [...series]
    .filter((s) => s.price > 0 && Boolean(s.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length < 2) {
    return { changePct: null, absoluteChange: null };
  }

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const diffDays = (new Date(latest.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24);
  // Acceptable period range for MoM: up to 95 days (covers monthly and quarterly snapshots)
  if (diffDays < 1 || diffDays > 120) {
    // Too far or identical timestamp
    return { changePct: null, absoluteChange: null, previousDate: previous.date, currentDate: latest.date };
  }

  const absChange = latest.price - previous.price;
  const pctChange = previous.price > 0 ? (absChange / previous.price) * 100 : 0;

  return {
    changePct: Math.round(pctChange * 10) / 10,
    absoluteChange: Math.round(absChange * 100) / 100,
    previousDate: previous.date,
    currentDate: latest.date
  };
}

/**
 * Year-over-Year (YoY) Price Change
 * Requires an actual observation approximately 1 year prior (between 300 and 420 days prior).
 * Will NOT invent, extrapolate, or substitute values if no 1-year historical observation exists.
 */
export function calculateYoYPriceChange(
  series: { date: string; price: number }[]
): { changePct: number | null; absoluteChange: number | null; baseDate?: string; currentDate?: string; status: string } {
  const sorted = [...series]
    .filter((s) => s.price > 0 && Boolean(s.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length < 2) {
    return { changePct: null, absoluteChange: null, status: 'insufficient_history' };
  }

  const latest = sorted[sorted.length - 1];
  const latestTime = new Date(latest.date).getTime();

  // Look for a historical point roughly 12 months prior (300 to 420 days)
  let yoyCandidate: { date: string; price: number } | null = null;
  let minDiffFromYear = Infinity;

  for (let i = 0; i < sorted.length - 1; i++) {
    const item = sorted[i];
    const diffDays = (latestTime - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 300 && diffDays <= 420) {
      const deviationFrom365 = Math.abs(diffDays - 365);
      if (deviationFrom365 < minDiffFromYear) {
        minDiffFromYear = deviationFrom365;
        yoyCandidate = item;
      }
    }
  }

  if (!yoyCandidate) {
    return {
      changePct: null,
      absoluteChange: null,
      currentDate: latest.date,
      status: 'no_prior_year_observation'
    };
  }

  const absChange = latest.price - yoyCandidate.price;
  const pctChange = yoyCandidate.price > 0 ? (absChange / yoyCandidate.price) * 100 : 0;

  return {
    changePct: Math.round(pctChange * 10) / 10,
    absoluteChange: Math.round(absChange * 100) / 100,
    baseDate: yoyCandidate.date,
    currentDate: latest.date,
    status: 'valid'
  };
}

// ==========================================
// 6. REGRESSION HARDENING (OLS & DIAGNOSTICS)
// ==========================================

export type RegressionDiagnosticStatus = 
  | 'valid'
  | 'insufficient_observations'
  | 'singular_matrix'
  | 'zero_variance'
  | 'collinear_features';

export interface HardenedRegressionCoefficient {
  variable: string;
  label: string;
  coef: number;
  stdErr: number;
  tStat: number;
  pValue: number;
  ci95Lower: number;
  ci95Upper: number;
  confidenceInterval?: [number, number];
  interpretation: string;
}

export interface HardenedRegressionResult {
  independentVariable: string;
  dependentVariable: string;
  n: number;
  k: number;
  df: number;
  dfResidual?: number;
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  fStatistic: number;
  pValueF: number;
  coefficients: HardenedRegressionCoefficient[];
  plainLanguageSummary: string[];
  caveats: string[];
  status: RegressionDiagnosticStatus;
  statusMessage?: string;
}

/**
 * Hardened Ordinary Least Squares (OLS) Solver with full statistical diagnostics:
 * - Checks sample size vs parameters (n >= k + 1)
 * - Identifies zero-variance predictor columns
 * - Detects singular matrices via partial-pivot condition monitoring
 * - Computes exact Student's t critical values for 95% confidence intervals
 * - Computes exact Student's t p-values and Fisher F-statistic p-value
 */
export function solveHardenedOLS(
  X: number[][],
  y: number[],
  labels: { variable: string; label: string }[],
  options?: {
    independentName?: string;
    dependentName?: string;
    interpretations?: (idx: number, b: number) => string;
  }
): HardenedRegressionResult {
  const n = X.length;
  const k = X.length > 0 ? X[0].length : 0;
  const df = n - k;

  const defaultEmptyResult: HardenedRegressionResult = {
    independentVariable: options?.independentName || 'Predictors',
    dependentVariable: options?.dependentName || 'Dependent Variable',
    n,
    k,
    df: Math.max(0, df),
    rSquared: 0,
    adjustedRSquared: 0,
    standardError: 0,
    fStatistic: 0,
    pValueF: 1.0,
    coefficients: [],
    plainLanguageSummary: [],
    caveats: [],
    status: 'insufficient_observations',
    statusMessage: 'Insufficient observations for model estimation.'
  };

  // 1. Minimum observation check
  if (n <= k || df < 1) {
    return {
      ...defaultEmptyResult,
      status: 'insufficient_observations',
      statusMessage: `Sample size (n=${n}) is too small to estimate ${k} parameters. Requires at least ${k + 1} valid observations.`,
      plainLanguageSummary: [`Insufficient sample size (n=${n}, requires >= ${k + 1}).`]
    };
  }

  // 2. Predictor variance check (skip column 0 if it is the intercept)
  for (let c = 1; c < k; c++) {
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let r = 0; r < n; r++) {
      const v = X[r][c];
      if (isNaN(v) || !isFinite(v)) {
        return {
          ...defaultEmptyResult,
          status: 'zero_variance',
          statusMessage: `Non-finite value (NaN or Infinity) detected in column "${labels[c]?.variable || c}".`,
          plainLanguageSummary: ['Estimation aborted due to non-finite values in predictor matrix.']
        };
      }
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    if (Math.abs(maxVal - minVal) < 1e-12) {
      return {
        ...defaultEmptyResult,
        status: 'zero_variance',
        statusMessage: `Predictor "${labels[c]?.variable || c}" has zero variance in the active sample (all values equal ${minVal}).`,
        plainLanguageSummary: [`Attribute "${labels[c]?.label || c}" lacks variation across observations.`]
      };
    }
  }

  // 3. Compute X'X and X'y
  const XtX: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
  const Xty: number[] = Array(k).fill(0);

  for (let i = 0; i < n; i++) {
    for (let r = 0; r < k; r++) {
      Xty[r] += X[i][r] * y[i];
      for (let c = 0; c < k; c++) {
        XtX[r][c] += X[i][r] * X[i][c];
      }
    }
  }

  // 4. Gauss-Jordan Elimination with Partial Pivoting to invert X'X
  const augmented: number[][] = XtX.map((row, r) => [
    ...row,
    ...Array.from({ length: k }, (_, c) => (r === c ? 1 : 0))
  ]);

  for (let i = 0; i < k; i++) {
    let maxRow = i;
    for (let r = i + 1; r < k; r++) {
      if (Math.abs(augmented[r][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = r;
      }
    }

    if (Math.abs(augmented[maxRow][i]) < 1e-10) {
      return {
        ...defaultEmptyResult,
        status: 'singular_matrix',
        statusMessage: 'Matrix singularity detected. High multicollinearity among predictor attributes.',
        plainLanguageSummary: ['Matrix singularity: features are perfectly or near-perfectly collinear.'],
        caveats: ['Remove redundant or collinear attributes from the regression specification.']
      };
    }

    const temp = augmented[i];
    augmented[i] = augmented[maxRow];
    augmented[maxRow] = temp;

    const pivot = augmented[i][i];
    for (let c = 0; c < 2 * k; c++) {
      augmented[i][c] /= pivot;
    }

    for (let r = 0; r < k; r++) {
      if (r !== i) {
        const factor = augmented[r][i];
        for (let c = 0; c < 2 * k; c++) {
          augmented[r][c] -= factor * augmented[i][c];
        }
      }
    }
  }

  const invXtX: number[][] = augmented.map((row) => row.slice(k));

  // 5. Beta coefficients: beta = inv(X'X) * X'y
  const beta: number[] = Array(k).fill(0);
  for (let r = 0; r < k; r++) {
    for (let c = 0; c < k; c++) {
      beta[r] += invXtX[r][c] * Xty[c];
    }
  }

  // 6. Sum of squared residuals and Total sum of squares
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    let yHat = 0;
    for (let j = 0; j < k; j++) {
      yHat += beta[j] * X[i][j];
    }
    ssRes += Math.pow(y[i] - yHat, 2);
    ssTot += Math.pow(y[i] - yMean, 2);
  }

  const s2 = df > 0 ? ssRes / df : 0;
  const standardError = Math.sqrt(s2);
  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const adjRSquared = df > 0 && n > 1 ? Math.max(0, 1 - (ssRes / df) / (ssTot / (n - 1))) : 0;

  // F-statistic for overall regression model
  const kPredictors = k - 1; // excluding intercept
  const fStat = kPredictors > 0 && s2 > 0 ? ((ssTot - ssRes) / kPredictors) / s2 : 0;
  const pValueF = kPredictors > 0 ? fDistributionPValue(fStat, kPredictors, df) : 1.0;

  // Student's t critical value for df = n - k
  const tCrit95 = studentTCriticalValue(df, 0.05);

  const coefficients: HardenedRegressionCoefficient[] = beta.map((b, idx) => {
    const varianceB = invXtX[idx][idx] * s2;
    const stdErr = varianceB > 0 ? Math.sqrt(varianceB) : 0;
    const tStat = stdErr > 0 ? b / stdErr : 0;
    const pVal = studentTPValue(tStat, df);

    const marginOfError = isFinite(tCrit95) ? tCrit95 * stdErr : 1.96 * stdErr;
    const ci95Lower = b - marginOfError;
    const ci95Upper = b + marginOfError;

    let interpretation = '';
    if (options?.interpretations) {
      interpretation = options.interpretations(idx, b);
    } else {
      interpretation = `Estimated coefficient β = ${b.toFixed(3)} (SE = ${stdErr.toFixed(3)}, p = ${pVal.toFixed(3)}).`;
    }

    const roundedLower = Math.round(ci95Lower * 1000) / 1000;
    const roundedUpper = Math.round(ci95Upper * 1000) / 1000;

    return {
      variable: labels[idx]?.variable || `x${idx}`,
      label: labels[idx]?.label || `Variable ${idx}`,
      coef: Math.round(b * 1000) / 1000,
      stdErr: Math.round(stdErr * 1000) / 1000,
      tStat: Math.round(tStat * 100) / 100,
      pValue: Math.round(pVal * 1000) / 1000,
      ci95Lower: roundedLower,
      ci95Upper: roundedUpper,
      confidenceInterval: [roundedLower, roundedUpper],
      interpretation
    };
  });

  return {
    independentVariable: options?.independentName || 'Predictors',
    dependentVariable: options?.dependentName || 'Dependent Variable',
    n,
    k,
    df,
    dfResidual: df,
    rSquared: Math.round(rSquared * 1000) / 1000,
    adjustedRSquared: Math.round(adjRSquared * 1000) / 1000,
    standardError: Math.round(standardError * 1000) / 1000,
    fStatistic: Math.round(fStat * 100) / 100,
    pValueF: Math.round(pValueF * 1000) / 1000,
    coefficients,
    plainLanguageSummary: [
      `Model R² = ${(rSquared * 100).toFixed(1)}% (Adjusted R² = ${(adjRSquared * 100).toFixed(1)}%): explains ${(
        rSquared * 100
      ).toFixed(1)}% of variation across ${n} observations.`,
      `Overall model significance: F(${kPredictors}, ${df}) = ${fStat.toFixed(2)}, p = ${pValueF < 0.001 ? '< 0.001' : pValueF.toFixed(3)}.`
    ],
    caveats: [
      'Observational regression estimates market price associations, not causal manufacturing production costs.',
      `Confidence intervals calibrated using Student's t critical value (t_crit = ${tCrit95.toFixed(3)}, df = ${df}).`
    ],
    status: 'valid',
    statusMessage: 'Model estimated successfully with defensible OLS diagnostics.'
  };
}
