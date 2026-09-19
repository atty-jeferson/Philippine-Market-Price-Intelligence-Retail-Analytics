import {
  ProductData,
  NormalizedProduct,
  ValueScoreWeights,
  MarketSummaryKPIs,
  BrandMetric,
  RetailerMetric,
  CrossRetailerSKUComparison,
  RegressionResult,
  PositioningTier
} from '../types';
import {
  studentTPValue,
  studentTCriticalValue,
  calculateConfidenceInterval,
  calculatePCI,
  calculateRPP,
  calculatePromotionDepth,
  calculatePromotionFrequency,
  calculateRetailerPriceIndex,
  calculateLogPriceVolatility,
  detectPriceEvents,
  calculateMoMPriceChange,
  calculateYoYPriceChange,
  solveHardenedOLS,
  getMarketMedianBenchmark,
  getBrandPortfolioBenchmark,
  getSubsegmentBenchmark,
  getPositioningTierBenchmark,
  createBenchmark,
  PriceBenchmark,
  BenchmarkType,
  PriceEvent,
  PriceVolatilityResult,
  HardenedRegressionResult
} from '../domain/statistics';
import { TOOTHPASTE_CATEGORY_CONFIG, CategoryConfig } from '../domain/categoryConfig';

// Re-export statistical engine capabilities for consumers
export {
  studentTPValue,
  studentTCriticalValue,
  calculateConfidenceInterval,
  calculatePCI,
  calculateRPP,
  calculatePromotionDepth,
  calculatePromotionFrequency,
  calculateRetailerPriceIndex,
  calculateLogPriceVolatility,
  detectPriceEvents,
  calculateMoMPriceChange,
  calculateYoYPriceChange,
  solveHardenedOLS,
  getMarketMedianBenchmark,
  getBrandPortfolioBenchmark,
  getSubsegmentBenchmark,
  getPositioningTierBenchmark,
  createBenchmark
};
export type { PriceBenchmark, BenchmarkType, PriceEvent, PriceVolatilityResult, HardenedRegressionResult };

export const DEFAULT_VALUE_WEIGHTS: ValueScoreWeights = {
  unitPriceAdvantage: 40,
  productRating: 20,
  discount: 15,
  featureCoverage: 15,
  brandPositioning: 10
};

/**
 * Standard median calculation
 */
export function calculateMedian(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Quantiles calculation (for IQR, Q1, Q3)
 */
export function calculatePercentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate mean and sample standard deviation
 */
export function calculateMeanAndStdDev(values: number[]): { mean: number; stdDev: number } {
  if (!values.length) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (values.length === 1) return { mean, stdDev: 0 };
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return { mean, stdDev: Math.sqrt(variance) };
}

/**
 * Normalizes all products by standard unit price (per 100g / 100ml),
 * calculates market price index, and computes transparent Value Score.
 */
export function normalizeProducts(
  rawProducts: ProductData[],
  weights: ValueScoreWeights = DEFAULT_VALUE_WEIGHTS
): { normalized: NormalizedProduct[]; marketMedian100g: number } {
  if (!rawProducts.length) return { normalized: [], marketMedian100g: 0 };

  // Step 1: Preliminary normalization of unit prices
  const prelim = rawProducts.map((p) => {
    const totalGrams = p.weight_grams;
    const pricePerGram = totalGrams > 0 ? p.price_php / totalGrams : 0;
    const pricePer100g = pricePerGram * 100;

    const pricePerMl = p.volume_ml && p.volume_ml > 0 ? p.price_php / p.volume_ml : null;
    const pricePer100ml = pricePerMl ? pricePerMl * 100 : null;

    return {
      ...p,
      price_per_gram: pricePerGram,
      price_per_100g: pricePer100g,
      price_per_ml: pricePerMl,
      price_per_100ml: pricePer100ml,
      total_weight_grams: totalGrams,
      total_volume_ml: p.volume_ml
    };
  });

  // Step 2: Compute market median price per 100g
  const unitPrices = prelim.map((p) => p.price_per_100g);
  const marketMedian100g = calculateMedian(unitPrices) || 1;

  const minUnitPrice = Math.min(...unitPrices);
  const maxUnitPrice = Math.max(...unitPrices);
  const priceRange = maxUnitPrice - minUnitPrice || 1;

  // Step 3: Compute Price Index & Configurable Value Score
  const totalWeightConfig =
    weights.unitPriceAdvantage +
    weights.productRating +
    weights.discount +
    weights.featureCoverage +
    weights.brandPositioning || 100;

  const normalized: NormalizedProduct[] = prelim.map((p) => {
    const priceIndex = (p.price_per_100g / marketMedian100g) * 100;
    const relativeDiff = ((p.price_per_100g - marketMedian100g) / marketMedian100g) * 100;

    // Component 1: Unit-Price Advantage (40%)
    // Lower unit price = higher score (inverse scale)
    const unitPriceScore = Math.max(0, Math.min(100, (1 - (p.price_per_100g - minUnitPrice) / priceRange) * 100));

    // Component 2: Product Rating (20%)
    const ratingScore = Math.max(0, Math.min(100, (p.rating / 5.0) * 100));

    // Component 3: Discount (15%)
    // 25% discount gives maximum discount score
    const discountScore = Math.max(0, Math.min(100, (p.discount_percent / 25) * 100));

    // Component 4: Feature Coverage (15%)
    const features = [
      p.fluoride,
      p.whitening,
      p.sensitivity,
      p.anti_cavity,
      p.gum_care,
      p.herbal,
      p.charcoal
    ].filter(Boolean).length;
    const featureScore = Math.min(100, (features / 5) * 100);

    // Component 5: Positioning tier score (10%)
    const tierMap: Record<PositioningTier, number> = {
      Budget: 90,
      Mainstream: 80,
      Specialty: 75,
      Premium: 70,
      Unknown: 75
    };
    const tierScore = tierMap[p.premium_positioning] || 75;

    const weightedScore =
      (unitPriceScore * weights.unitPriceAdvantage +
        ratingScore * weights.productRating +
        discountScore * weights.discount +
        featureScore * weights.featureCoverage +
        tierScore * weights.brandPositioning) /
      totalWeightConfig;

    return {
      ...p,
      price_index: Math.round(priceIndex),
      relative_percent_vs_median: Math.round(relativeDiff * 10) / 10,
      value_score: Math.max(1, Math.min(99, Math.round(weightedScore)))
    };
  });

  return { normalized, marketMedian100g };
}

/**
 * Calculates Market Overview KPIs dynamically
 */
export function calculateMarketSummaryKPIs(products: NormalizedProduct[]): MarketSummaryKPIs {
  if (!products.length) {
    return {
      medianMarketPrice: 0,
      medianPricePer100g: 0,
      meanPricePer100g: 0,
      lowestUnitPrice: { product: {} as NormalizedProduct, pricePer100g: 0 },
      highestUnitPrice: { product: {} as NormalizedProduct, pricePer100g: 0 },
      totalProducts: 0,
      totalBrands: 0,
      totalRetailers: 0,
      promotionRate: 0,
      avgDiscountPercent: 0,
      stdDevPricePer100g: 0,
      coefficientOfVariation: 0,
      iqrPricePer100g: 0,
      q1PricePer100g: 0,
      q3PricePer100g: 0,
      minPricePer100g: 0,
      maxPricePer100g: 0
    };
  }

  const rawPrices = products.map((p) => p.price_php);
  const unitPrices = products.map((p) => p.price_per_100g);

  const medianMarketPrice = calculateMedian(rawPrices);
  const medianPricePer100g = calculateMedian(unitPrices);
  const { mean: meanPricePer100g, stdDev: stdDevPricePer100g } = calculateMeanAndStdDev(unitPrices);

  const cv = meanPricePer100g > 0 ? (stdDevPricePer100g / meanPricePer100g) * 100 : 0;

  const q1 = calculatePercentile(unitPrices, 0.25);
  const q3 = calculatePercentile(unitPrices, 0.75);
  const iqr = q3 - q1;

  const sortedByUnit = [...products].sort((a, b) => a.price_per_100g - b.price_per_100g);
  const lowest = sortedByUnit[0];
  const highest = sortedByUnit[sortedByUnit.length - 1];

  const brands = new Set(products.map((p) => p.brand));
  const retailers = new Set(products.map((p) => p.retailer));

  const promoProducts = products.filter((p) => p.discount_percent > 0 || p.sale_price_php !== null);
  const promotionRate = (promoProducts.length / products.length) * 100;
  const avgDiscount =
    promoProducts.length > 0
      ? promoProducts.reduce((sum, p) => sum + p.discount_percent, 0) / promoProducts.length
      : 0;

  return {
    medianMarketPrice,
    medianPricePer100g,
    meanPricePer100g,
    lowestUnitPrice: { product: lowest, pricePer100g: lowest.price_per_100g },
    highestUnitPrice: { product: highest, pricePer100g: highest.price_per_100g },
    totalProducts: products.length,
    totalBrands: brands.size,
    totalRetailers: retailers.size,
    promotionRate: Math.round(promotionRate * 10) / 10,
    avgDiscountPercent: Math.round(avgDiscount * 10) / 10,
    stdDevPricePer100g: Math.round(stdDevPricePer100g * 100) / 100,
    coefficientOfVariation: Math.round(cv * 10) / 10,
    iqrPricePer100g: Math.round(iqr * 100) / 100,
    q1PricePer100g: Math.round(q1 * 100) / 100,
    q3PricePer100g: Math.round(q3 * 100) / 100,
    minPricePer100g: lowest.price_per_100g,
    maxPricePer100g: highest.price_per_100g
  };
}

/**
 * Calculates Brand Analytics with Price Premiums and Confidence Intervals
 */
export function calculateBrandMetrics(
  products: NormalizedProduct[],
  marketMedian100g: number
): BrandMetric[] {
  const brandGroups = new Map<string, NormalizedProduct[]>();

  products.forEach((p) => {
    const list = brandGroups.get(p.brand) || [];
    list.push(p);
    brandGroups.set(p.brand, list);
  });

  const results: BrandMetric[] = [];
  const totalCount = products.length || 1;

  brandGroups.forEach((items, brand) => {
    const prices = items.map((p) => p.price_per_100g);
    const medianPrice = calculateMedian(prices);
    const { mean, stdDev } = calculateMeanAndStdDev(prices);

    // 95% Confidence Interval for mean price/100g using Student's t critical value (df = n - 1)
    const ciResult = calculateConfidenceInterval(mean, stdDev, items.length, 0.95);
    const ciLower = ciResult.ciLower !== null ? ciResult.ciLower : mean;
    const ciUpper = ciResult.ciUpper !== null ? ciResult.ciUpper : mean;

    const premium = marketMedian100g > 0 ? ((medianPrice - marketMedian100g) / marketMedian100g) * 100 : 0;
    const avgRating = items.reduce((s, p) => s + p.rating, 0) / items.length;

    // Determine primary positioning tier by mode
    const tierCounts: Record<string, number> = {};
    items.forEach((p) => {
      tierCounts[p.premium_positioning] = (tierCounts[p.premium_positioning] || 0) + 1;
    });
    const primaryTier = (Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0][0] ||
      'Mainstream') as PositioningTier;

    results.push({
      brand,
      productCount: items.length,
      presenceShare: Math.round((items.length / totalCount) * 1000) / 10,
      medianPricePer100g: Math.round(medianPrice * 100) / 100,
      meanPricePer100g: Math.round(mean * 100) / 100,
      stdDevPricePer100g: Math.round(stdDev * 100) / 100,
      ciLower: Math.round(ciLower * 100) / 100,
      ciUpper: Math.round(ciUpper * 100) / 100,
      tCritical: isNaN(ciResult.tCritical) ? undefined : Math.round(ciResult.tCritical * 1000) / 1000,
      df: ciResult.df,
      marketPremiumPercent: Math.round(premium * 10) / 10,
      avgRating: Math.round(avgRating * 10) / 10,
      primaryTier,
      sampleVariants: Array.from(new Set(items.map((i) => i.variant))).slice(0, 3)
    });
  });

  return results.sort((a, b) => b.medianPricePer100g - a.medianPricePer100g);
}

/**
 * Calculates Retailer Analytics
 */
export function calculateRetailerMetrics(
  products: NormalizedProduct[],
  marketMedian100g: number
): RetailerMetric[] {
  const retailerGroups = new Map<string, NormalizedProduct[]>();

  products.forEach((p) => {
    const list = retailerGroups.get(p.retailer) || [];
    list.push(p);
    retailerGroups.set(p.retailer, list);
  });

  const results: RetailerMetric[] = [];

  retailerGroups.forEach((items, retailer) => {
    const prices = items.map((p) => p.price_per_100g);
    const median = calculateMedian(prices);
    const { mean } = calculateMeanAndStdDev(prices);
    const promoCount = items.filter((p) => p.discount_percent > 0).length;
    const avgDiscount =
      promoCount > 0
        ? items.filter((p) => p.discount_percent > 0).reduce((sum, p) => sum + p.discount_percent, 0) /
          promoCount
        : 0;

    const retailerIndex = marketMedian100g > 0 ? (median / marketMedian100g) * 100 : 100;

    results.push({
      retailer,
      retailerType: items[0].retailer_type,
      skuCount: items.length,
      medianPricePer100g: Math.round(median * 100) / 100,
      meanPricePer100g: Math.round(mean * 100) / 100,
      retailerPriceIndex: Math.round(retailerIndex),
      avgDiscountPercent: Math.round(avgDiscount * 10) / 10,
      promoCount,
      locations: Array.from(new Set(items.map((p) => p.location)))
    });
  });

  return results.sort((a, b) => a.medianPricePer100g - b.medianPricePer100g);
}

/**
 * Cross-Retailer Price Dispersion on the SAME identical SKU
 */
export function calculateCrossRetailerSKUs(products: NormalizedProduct[]): CrossRetailerSKUComparison[] {
  // Key by canonical product name (ignoring specific retailer suffixes)
  const canonicalGroups = new Map<string, NormalizedProduct[]>();

  products.forEach((p) => {
    // Normalizing name for cross-matching
    const key = `${p.brand}:::${p.variant}:::${p.size_value}${p.size_unit}`;
    const list = canonicalGroups.get(key) || [];
    list.push(p);
    canonicalGroups.set(key, list);
  });

  const comparisons: CrossRetailerSKUComparison[] = [];

  canonicalGroups.forEach((items) => {
    if (items.length >= 2) {
      // Find retailers
      const retailerEntries = items.map((item) => ({
        retailer: item.retailer,
        price: item.price_php,
        pricePer100g: item.price_per_100g,
        isOnSale: item.discount_percent > 0,
        discountPercent: item.discount_percent
      }));

      const sortedByPrice = [...retailerEntries].sort((a, b) => a.price - b.price);
      const minPrice = sortedByPrice[0].price;
      const maxPrice = sortedByPrice[sortedByPrice.length - 1].price;
      const absoluteGap = maxPrice - minPrice;
      const percentageGap = minPrice > 0 ? (absoluteGap / minPrice) * 100 : 0;

      comparisons.push({
        canonicalName: items[0].product_name,
        brand: items[0].brand,
        size: `${items[0].size_value}${items[0].size_unit}`,
        weightGrams: items[0].total_weight_grams,
        retailers: retailerEntries,
        minPrice,
        maxPrice,
        absoluteGap: Math.round(absoluteGap * 100) / 100,
        percentageGap: Math.round(percentageGap * 10) / 10,
        cheapestRetailer: sortedByPrice[0].retailer,
        priciestRetailer: sortedByPrice[sortedByPrice.length - 1].retailer
      });
    }
  });

  return comparisons.sort((a, b) => b.percentageGap - a.percentageGap);
}

/**
 * Econometric Size Economics: OLS Regression log(price/100g) = β0 + β1 log(size) + ε
 */
export function calculateSizeEconomicsRegression(products: NormalizedProduct[]): RegressionResult {
  const valid = products.filter((p) => p.total_weight_grams > 0 && p.price_per_100g > 0);
  const n = valid.length;

  if (n < 4) {
    return {
      independentVariable: 'Log(Package Weight in Grams)',
      dependentVariable: 'Log(Price per 100g)',
      n,
      k: 2,
      df: Math.max(0, n - 2),
      rSquared: 0,
      adjustedRSquared: 0,
      standardError: 0,
      fStatistic: 0,
      pValueF: 1,
      status: 'insufficient_observations',
      statusMessage: `Insufficient observations (n=${n}, requires >= 4) to estimate package size economics.`,
      coefficients: [],
      plainLanguageSummary: ['Insufficient sample size to estimate regression.'],
      caveats: ['Requires at least 4 observations.']
    };
  }

  const X = valid.map((p) => [1, Math.log(p.total_weight_grams)]);
  const y = valid.map((p) => Math.log(p.price_per_100g));
  const labels = [
    { variable: 'Intercept (β0)', label: 'Baseline constant' },
    { variable: 'log(size) (β1)', label: 'Size elasticity of unit price' }
  ];

  const result = solveHardenedOLS(X, y, labels, {
    independentName: 'Log(Net Package Size in Grams)',
    dependentName: 'Log(Price per 100g in PHP)',
    interpretations: (idx, b) => {
      if (idx === 0) return 'Expected log(unit price) when package size equals 1 gram.';
      return `A 10% increase in net tube size is associated with approximately a ${(b * 10).toFixed(1)}% change in price per 100g.`;
    }
  });

  const slope = result.coefficients[1]?.coef ?? 0;
  const isNegative = slope < 0;

  const plainLanguageSummary = [
    `Elasticity coefficient (β1): ${slope}. ${
      isNegative
        ? 'Larger package sizes are associated with lower unit prices in the observed sample.'
        : 'In this sample, larger packages do not show a significant negative unit-price slope.'
    }`,
    `R² = ${(result.rSquared * 100).toFixed(1)}%: Package size variation explains approximately ${(
      result.rSquared * 100
    ).toFixed(1)}% of the variance in logarithmic unit price in this sample.`
  ];

  return {
    ...result,
    plainLanguageSummary,
    caveats: [
      'Observational correlation does not prove causality or production cost dynamics.',
      'Unit price discount may reflect multi-pack promotions or bulk inventory clearances.',
      `Statistical inference calibrated using Student's t distribution with df = ${result.df}.`
    ]
  };
}

/**
 * Multivariate Hedonic Price Regression
 * log(unit_price) = β0 + Σ β_attribute * attribute + β_size * log(size) + ε
 * Accepts optional CategoryConfig to dynamically derive candidate attributes.
 */
export function calculateHedonicRegression(
  products: NormalizedProduct[],
  categoryConfig: CategoryConfig = TOOTHPASTE_CATEGORY_CONFIG
): RegressionResult {
  const valid = products.filter((p) => p.total_weight_grams > 0 && p.price_per_100g > 0);
  const n = valid.length;

  // Derive candidate attributes from categoryConfig
  const candidateAttrs = categoryConfig.attributes || [];
  
  // Filter for candidate attributes that are boolean or numeric and have non-zero variance across the sample
  interface ActiveAttributeDef {
    key: string;
    label: string;
    values: number[];
  }

  const activeAttrs: ActiveAttributeDef[] = [];
  const excludedNotes: string[] = [];

  candidateAttrs.forEach((attrDef) => {
    const rawVals: number[] = valid.map((p) => {
      const v = (p as unknown as Record<string, unknown>)[attrDef.key];
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'number' && !isNaN(v)) return v;
      return 0;
    });

    const minV = Math.min(...rawVals);
    const maxV = Math.max(...rawVals);

    // If zero variance, exclude to prevent singular matrix
    if (Math.abs(maxV - minV) < 1e-9) {
      excludedNotes.push(`Attribute "${attrDef.label}" has zero variance (${minV === 1 ? '100%' : '0%'} present) and was excluded to prevent collinearity.`);
    } else {
      activeAttrs.push({
        key: attrDef.key,
        label: attrDef.label,
        values: rawVals
      });
    }
  });

  const k = 1 + activeAttrs.length + 1; // 1 (intercept) + active attrs + 1 (logSize)
  if (n < k + 1) {
    return {
      independentVariable: 'Product Attributes & Package Size',
      dependentVariable: 'Log(Price per 100g)',
      n,
      k,
      df: Math.max(0, n - k),
      rSquared: 0,
      adjustedRSquared: 0,
      standardError: 0,
      fStatistic: 0,
      pValueF: 1,
      status: 'insufficient_observations',
      statusMessage: `Sample size too small for multivariate hedonic estimation (n=${n}, requires >= ${k + 1} observations for ${k} parameters).`,
      coefficients: [],
      plainLanguageSummary: [`Sample size too small for multivariate hedonic estimation (n=${n}, requires >= ${k + 1} observations).`],
      caveats: ['Observational pricing model', ...excludedNotes]
    };
  }

  const y = valid.map((p) => Math.log(p.price_per_100g));
  const X = valid.map((p, rIdx) => [
    1,
    ...activeAttrs.map((a) => a.values[rIdx]),
    Math.log(p.total_weight_grams)
  ]);

  const labels = [
    { variable: 'Intercept', label: 'Base Product (Standard Formulation, No Actives)' },
    ...activeAttrs.map((a) => ({ variable: a.key, label: a.label })),
    { variable: 'logSize', label: 'Log(Net Size in Grams)' }
  ];

  const result = solveHardenedOLS(X, y, labels, {
    independentName: 'Category Formulation Attributes + Log(Size)',
    dependentName: 'Log(Price per 100g in PHP)',
    interpretations: (idx, b) => {
      if (idx === 0) return 'Baseline logarithm of unit price for a non-differentiated formulation.';
      if (idx === labels.length - 1) return `A 10% larger package size is associated with a ${(b * 10).toFixed(1)}% change in unit price.`;
      const pctChange = Math.round((Math.exp(b) - 1) * 100);
      return `Holding other features constant, this attribute is associated with an estimated ${
        pctChange >= 0 ? `+${pctChange}%` : `${pctChange}%`
      } difference in normalized price.`;
    }
  });

  const summaries: string[] = [
    `Model R² = ${(result.rSquared * 100).toFixed(1)}%: Product formulation features and package size together explain ${(
      result.rSquared * 100
    ).toFixed(1)}% of unit price variance in this observed sample.`
  ];

  result.coefficients.slice(1, -1).forEach((c) => {
    if (c.pValue < 0.1) {
      const pct = Math.round((Math.exp(c.coef) - 1) * 100);
      summaries.push(`${c.label} carries an estimated ${pct >= 0 ? '+' : ''}${pct}% price premium (p = ${c.pValue < 0.001 ? '< 0.001' : c.pValue.toFixed(3)}).`);
    }
  });

  return {
    ...result,
    plainLanguageSummary: summaries,
    caveats: [
      'Hedonic price regressions show observed market willingness-to-pay differentials, not chemical manufacturing costs.',
      'Brand equity and retail channel placement may correlate with advanced formula tags.',
      `Confidence intervals calculated using Student's t critical values with df = ${result.df}.`,
      ...excludedNotes
    ]
  };
}

/**
 * Standard normal / Student-t two-tailed p-value calculation
 */
export function approximatePValueFromT(t: number, df: number): number {
  return studentTPValue(t, df);
}

/**
 * Generates natural language insights strictly based on factual calculated metrics
 */
export function generateMarketInsights(
  products: NormalizedProduct[],
  kpis: MarketSummaryKPIs,
  brandMetrics: BrandMetric[],
  crossRetailer: CrossRetailerSKUComparison[]
): string[] {
  if (!products.length) return ['No active observations loaded in dataset.'];

  const insights: string[] = [];

  // Insight 1: Market Median Unit Price
  insights.push(
    `Among the ${kpis.totalProducts} observed products across ${kpis.totalBrands} brands, the market median normalized price is ₱${kpis.medianPricePer100g.toFixed(
      2
    )} per 100g.`
  );

  // Insight 2: Brand Premium leader
  if (brandMetrics.length > 0) {
    const highestBrand = brandMetrics[0];
    const lowestBrand = brandMetrics[brandMetrics.length - 1];

    insights.push(
      `${highestBrand.brand} commands the highest median unit price in this sample at ₱${highestBrand.medianPricePer100g.toFixed(
        2
      )}/100g (${highestBrand.marketPremiumPercent >= 0 ? '+' : ''}${highestBrand.marketPremiumPercent}% vs market median), while ${
        lowestBrand.brand
      } is priced lowest at ₱${lowestBrand.medianPricePer100g.toFixed(2)}/100g (${lowestBrand.marketPremiumPercent}% vs median).`
    );
  }

  // Insight 3: Cross-Retailer Price Dispersion on identical SKU
  if (crossRetailer.length > 0) {
    const topGap = crossRetailer[0];
    insights.push(
      `For identical SKUs, "${topGap.canonicalName}" displays the widest retailer price dispersion: ₱${topGap.minPrice.toFixed(
        2
      )} at ${topGap.cheapestRetailer} versus ₱${topGap.maxPrice.toFixed(2)} at ${topGap.priciestRetailer}—a ${
        topGap.percentageGap
      }% price differential.`
    );
  }

  // Insight 4: Pack size economy
  const multiPacks = products.filter((p) => p.is_multipack);
  const singlePacks = products.filter((p) => !p.is_multipack);
  if (multiPacks.length > 0 && singlePacks.length > 0) {
    const medianMulti = calculateMedian(multiPacks.map((p) => p.price_per_100g));
    const medianSingle = calculateMedian(singlePacks.map((p) => p.price_per_100g));
    const savings = Math.round(((medianSingle - medianMulti) / medianSingle) * 100);
    if (savings > 0) {
      insights.push(
        `Value twin packs and bundles show an average normalized unit saving of approximately ${savings}% compared to single unit tubes in the observed sample.`
      );
    }
  }

  // Insight 5: Promotion prevalence
  insights.push(
    `Approximately ${kpis.promotionRate}% of observed listings currently exhibit active promotional discounts or value-bundle pricing, with an average discount depth of ${kpis.avgDiscountPercent}% where applied.`
  );

  return insights;
}
