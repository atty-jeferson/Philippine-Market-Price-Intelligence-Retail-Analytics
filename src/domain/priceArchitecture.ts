/**
 * THE GROCER - Phase 5 Price Architecture & Descriptive Price Waterfall
 * 
 * Concept:
 * 1. Brand Price Architecture (Portfolio hierarchy, brand median vs competitive-set median)
 * 2. Retailer Price Architecture (Retailer-relative SKU positions, isolating channel effect without causal claims)
 * 3. Descriptive Price Waterfall (Deterministic decomposition of observed shelf prices)
 */

import { NormalizedProduct, PositioningTier } from '../types';
import { CompetitiveSet, buildCompetitiveSet } from './competitive';

export interface BrandSKUArchitectureItem {
  product_id: string;
  product_name: string;
  variant: string;
  size_value: number;
  size_unit: string;
  positioning_tier: PositioningTier;
  observed_shelf_price: number;
  price_per_100g: number;
  retailer: string;
  // Distinct Relative Benchmarks:
  market_median_unit_price: number;
  brand_portfolio_median_unit_price: number;
  competitive_set_median_unit_price: number;
  premium_vs_market_percent: number;      // ((price_per_100g - market) / market) * 100
  premium_vs_brand_median_percent: number; // ((price_per_100g - brandMedian) / brandMedian) * 100
  premium_vs_comp_set_percent: number;     // ((price_per_100g - compSetMedian) / compSetMedian) * 100
  retailer_count: number;
  retailer_price_range: { min: number; max: number; spread_percent: number };
  competitive_set: CompetitiveSet;
  normalized_product: NormalizedProduct;
}

export interface BrandPricePortfolio {
  brand_name: string;
  sku_count: number;
  lowest_priced_sku: { name: string; price_php: number; price_per_100g: number };
  highest_priced_sku: { name: string; price_php: number; price_per_100g: number };
  median_shelf_price: number;
  median_unit_price: number;
  mean_unit_price: number;
  price_range_php: number;
  unit_price_spread_percent: number;
  premium_vs_market_percent: number;
  skus: BrandSKUArchitectureItem[];
}

export interface RetailerSKUPositionItem {
  product_id: string;
  product_name: string;
  brand: string;
  size_label: string;
  observed_shelf_price: number;
  regular_price: number;
  price_per_100g: number;
  is_on_promotion: boolean;
  discount_percent: number;
  // Retailer vs SKU Market Median across all retailers
  sku_market_median_price: number;
  retailer_differential_php: number;       // shelf_price - sku_market_median_price
  retailer_differential_percent: number;   // ((shelf_price - sku_market_median) / sku_market_median) * 100
  // Benchmark per 100g
  market_median_unit_price: number;
  unit_price_differential_percent: number;
}

export interface RetailerPricePortfolio {
  retailer_name: string;
  retailer_type: string;
  sku_count: number;
  market_price_index: number;              // 100 = market median
  promotion_intensity_percent: number;     // % of SKUs on promotion
  average_discount_percent: number;
  price_dispersion_std_dev: number;
  interquartile_range_unit_price: number;
  skus: RetailerSKUPositionItem[];
  observed_channel_differential_note: string;
}

export interface PriceWaterfallStep {
  step_id: string;
  label: string;
  category: 'benchmark' | 'brand_tier' | 'sku_formulation' | 'channel_differential' | 'promotion_discount' | 'final_price';
  value_php: number;          // Nominal PHP contribution (positive or negative)
  cumulative_php: number;     // Running total
  percentage_of_benchmark: number;
  formula: string;
  description: string;
  is_available: boolean;
}

export interface PriceWaterfall {
  anchor_sku: NormalizedProduct;
  retailer_name: string;
  market_benchmark_reference: number;
  steps: PriceWaterfallStep[];
  observed_shelf_price: number;
  calculated_reconciliation_diff: number; // Verification check (|observed - cumulative| < 0.01)
  limitations: string[];
}

/**
 * Calculates Descriptive Price Architecture for a specific Brand.
 */
export function calculateBrandPriceArchitecture(
  brandName: string,
  allProducts: NormalizedProduct[],
  marketMedian100g: number
): BrandPricePortfolio | null {
  const brandProducts = allProducts.filter(
    (p) => p.brand.toLowerCase().trim() === brandName.toLowerCase().trim()
  );

  if (!brandProducts.length) return null;

  // Calculate Brand Portfolio Median
  const brandUnitPrices = brandProducts.map((p) => p.price_per_100g).sort((a, b) => a - b);
  const brandShelfPrices = brandProducts.map((p) => p.price_php).sort((a, b) => a - b);

  const brandMedianUnit = brandUnitPrices[Math.floor(brandUnitPrices.length / 2)];
  const brandMedianShelf = brandShelfPrices[Math.floor(brandShelfPrices.length / 2)];
  const brandMeanUnit = brandUnitPrices.reduce((sum, v) => sum + v, 0) / brandUnitPrices.length;

  const lowestSku = [...brandProducts].sort((a, b) => a.price_php - b.price_php)[0];
  const highestSku = [...brandProducts].sort((a, b) => b.price_php - a.price_php)[0];

  const minPrice = lowestSku.price_php;
  const maxPrice = highestSku.price_php;
  const priceRange = maxPrice - minPrice;
  const unitPriceSpread = brandMedianUnit > 0
    ? Math.round(((brandUnitPrices[brandUnitPrices.length - 1] - brandUnitPrices[0]) / brandMedianUnit) * 1000) / 10
    : 0;

  const premiumVsMarket = marketMedian100g > 0
    ? Math.round(((brandMedianUnit - marketMedian100g) / marketMedian100g) * 1000) / 10
    : 0;

  // Group by canonical SKU to examine retailer price ranges
  const skus: BrandSKUArchitectureItem[] = brandProducts.map((p) => {
    // Generate competitive set for this SKU
    const compSet = buildCompetitiveSet(p, allProducts);

    // Cross-retailer observations of this same SKU
    const sameSkuVariants = allProducts.filter(
      (item) => item.brand.toLowerCase() === p.brand.toLowerCase() &&
                item.size_value === p.size_value &&
                item.variant.toLowerCase() === p.variant.toLowerCase()
    );

    const variantPrices = sameSkuVariants.map((v) => v.price_php);
    const minVarPrice = Math.min(...variantPrices);
    const maxVarPrice = Math.max(...variantPrices);
    const varSpreadPct = minVarPrice > 0
      ? Math.round(((maxVarPrice - minVarPrice) / minVarPrice) * 1000) / 10
      : 0;

    const premVsMarket = marketMedian100g > 0
      ? Math.round(((p.price_per_100g - marketMedian100g) / marketMedian100g) * 1000) / 10
      : 0;

    const premVsBrand = brandMedianUnit > 0
      ? Math.round(((p.price_per_100g - brandMedianUnit) / brandMedianUnit) * 1000) / 10
      : 0;

    const premVsComp = compSet.median_unit_price > 0
      ? Math.round(((p.price_per_100g - compSet.median_unit_price) / compSet.median_unit_price) * 1000) / 10
      : 0;

    return {
      product_id: p.product_id,
      product_name: p.product_name,
      variant: p.variant,
      size_value: p.size_value,
      size_unit: p.size_unit,
      positioning_tier: p.premium_positioning,
      observed_shelf_price: p.price_php,
      price_per_100g: p.price_per_100g,
      retailer: p.retailer,
      market_median_unit_price: marketMedian100g,
      brand_portfolio_median_unit_price: brandMedianUnit,
      competitive_set_median_unit_price: compSet.median_unit_price,
      premium_vs_market_percent: premVsMarket,
      premium_vs_brand_median_percent: premVsBrand,
      premium_vs_comp_set_percent: premVsComp,
      retailer_count: sameSkuVariants.length,
      retailer_price_range: {
        min: minVarPrice,
        max: maxVarPrice,
        spread_percent: varSpreadPct
      },
      competitive_set: compSet,
      normalized_product: p
    };
  });

  // Sort by net content, then unit price
  skus.sort((a, b) => a.size_value - b.size_value || a.price_per_100g - b.price_per_100g);

  return {
    brand_name: brandName,
    sku_count: brandProducts.length,
    lowest_priced_sku: {
      name: lowestSku.product_name,
      price_php: lowestSku.price_php,
      price_per_100g: lowestSku.price_per_100g
    },
    highest_priced_sku: {
      name: highestSku.product_name,
      price_php: highestSku.price_php,
      price_per_100g: highestSku.price_per_100g
    },
    median_shelf_price: brandMedianShelf,
    median_unit_price: Math.round(brandMedianUnit * 100) / 100,
    mean_unit_price: Math.round(brandMeanUnit * 100) / 100,
    price_range_php: Math.round(priceRange * 100) / 100,
    unit_price_spread_percent: unitPriceSpread,
    premium_vs_market_percent: premiumVsMarket,
    skus
  };
}

/**
 * Calculates Retailer Price Architecture for a specific Retailer banner.
 */
export function calculateRetailerPriceArchitecture(
  retailerName: string,
  allProducts: NormalizedProduct[],
  marketMedian100g: number
): RetailerPricePortfolio | null {
  const retailerProducts = allProducts.filter(
    (p) => p.retailer.toLowerCase().trim() === retailerName.toLowerCase().trim()
  );

  if (!retailerProducts.length) return null;

  // Calculate retailer market price index
  const retailerUnitPrices = retailerProducts.map((p) => p.price_per_100g).sort((a, b) => a - b);
  const retMedianUnit = retailerUnitPrices[Math.floor(retailerUnitPrices.length / 2)];
  const marketPriceIndex = marketMedian100g > 0
    ? Math.round((retMedianUnit / marketMedian100g) * 1000) / 10
    : 100;

  // Promotion intensity
  const promoCount = retailerProducts.filter((p) => p.discount_percent > 0 || p.sale_price_php !== null).length;
  const promoIntensity = Math.round((promoCount / retailerProducts.length) * 1000) / 10;
  const discounts = retailerProducts.map((p) => p.discount_percent).filter((d) => d > 0);
  const avgDiscount = discounts.length > 0
    ? Math.round((discounts.reduce((sum, d) => sum + d, 0) / discounts.length) * 10) / 10
    : 0;

  // Dispersion & IQR
  const q1 = retailerUnitPrices[Math.floor(retailerUnitPrices.length * 0.25)];
  const q3 = retailerUnitPrices[Math.floor(retailerUnitPrices.length * 0.75)];
  const iqr = Math.round((q3 - q1) * 100) / 100;

  const mean = retailerUnitPrices.reduce((s, v) => s + v, 0) / retailerUnitPrices.length;
  const variance = retailerUnitPrices.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / retailerUnitPrices.length;
  const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

  // Per-SKU breakdown
  const skus: RetailerSKUPositionItem[] = retailerProducts.map((p) => {
    // Find all cross-retailer observations of identical brand + variant + size
    const peerObservations = allProducts.filter(
      (item) => item.brand.toLowerCase() === p.brand.toLowerCase() &&
                item.size_value === p.size_value &&
                item.variant.toLowerCase() === p.variant.toLowerCase()
    );

    const peerPrices = peerObservations.map((item) => item.price_php).sort((a, b) => a - b);
    const skuMarketMedian = peerPrices.length > 0
      ? peerPrices[Math.floor(peerPrices.length / 2)]
      : p.price_php;

    const diffPhp = Math.round((p.price_php - skuMarketMedian) * 100) / 100;
    const diffPct = skuMarketMedian > 0
      ? Math.round(((p.price_php - skuMarketMedian) / skuMarketMedian) * 1000) / 10
      : 0;

    const unitDiffPct = marketMedian100g > 0
      ? Math.round(((p.price_per_100g - marketMedian100g) / marketMedian100g) * 1000) / 10
      : 0;

    return {
      product_id: p.product_id,
      product_name: p.product_name,
      brand: p.brand,
      size_label: `${p.size_value}${p.size_unit}`,
      observed_shelf_price: p.price_php,
      regular_price: p.regular_price_php || p.price_php,
      price_per_100g: p.price_per_100g,
      is_on_promotion: p.discount_percent > 0 || p.sale_price_php !== null,
      discount_percent: p.discount_percent || 0,
      sku_market_median_price: skuMarketMedian,
      retailer_differential_php: diffPhp,
      retailer_differential_percent: diffPct,
      market_median_unit_price: marketMedian100g,
      unit_price_differential_percent: unitDiffPct
    };
  });

  skus.sort((a, b) => b.retailer_differential_percent - a.retailer_differential_percent);

  return {
    retailer_name: retailerName,
    retailer_type: retailerProducts[0]?.retailer_type || 'Retail Channel',
    sku_count: retailerProducts.length,
    market_price_index: marketPriceIndex,
    promotion_intensity_percent: promoIntensity,
    average_discount_percent: avgDiscount,
    price_dispersion_std_dev: stdDev,
    interquartile_range_unit_price: iqr,
    skus,
    observed_channel_differential_note:
      'Reflects empirical price differences observed across shelf audits and listings. Does not imply causal pricing intent or wholesale margin differences.'
  };
}

/**
 * Calculates a deterministic Descriptive Price Waterfall for an observed SKU.
 * 
 * Formula Structure:
 * 1. Base Market Reference = (Market Median ₱/100g * SKU Net Content) / 100
 * 2. Brand Positioning Delta = (Brand Median ₱/100g - Market Median ₱/100g) * SKU Content / 100
 * 3. SKU Formulation & Size Delta = (SKU Regular Price - Brand Shelf Benchmark)
 * 4. Retailer Channel Differential = (Retailer Regular Shelf Price - Average SKU Regular Price)
 * 5. Promotion Adjustment = - (Regular Price - Observed Shelf Price)
 * 6. Observed Shelf Price = Cumulative sum of steps 1 through 5.
 */
export function calculatePriceWaterfall(
  product: NormalizedProduct,
  allProducts: NormalizedProduct[],
  marketMedian100g: number
): PriceWaterfall {
  const contentMultiplier = (product.weight_grams || product.size_value || 100) / 100;

  // Step 1: Market Benchmark Reference for this pack size
  const marketBenchmarkEquivalent = Math.round(marketMedian100g * contentMultiplier * 100) / 100;

  // Step 2: Brand Median Unit Price
  const brandPeers = allProducts.filter(
    (p) => p.brand.toLowerCase() === product.brand.toLowerCase()
  );
  const brandUnitPrices = brandPeers.map((p) => p.price_per_100g).sort((a, b) => a - b);
  const brandMedianUnit = brandUnitPrices.length > 0
    ? brandUnitPrices[Math.floor(brandUnitPrices.length / 2)]
    : marketMedian100g;

  const brandBenchmarkEquivalent = Math.round(brandMedianUnit * contentMultiplier * 100) / 100;
  const brandPositionDelta = Math.round((brandBenchmarkEquivalent - marketBenchmarkEquivalent) * 100) / 100;

  // Step 3: SKU Market Regular Price (across all retailers)
  const skuPeers = allProducts.filter(
    (p) => p.brand.toLowerCase() === product.brand.toLowerCase() &&
           p.size_value === product.size_value &&
           p.variant.toLowerCase() === product.variant.toLowerCase()
  );
  const skuRegularPrices = skuPeers.map((p) => p.regular_price_php || p.price_php).sort((a, b) => a - b);
  const skuMarketRegularPrice = skuRegularPrices.length > 0
    ? skuRegularPrices[Math.floor(skuRegularPrices.length / 2)]
    : (product.regular_price_php || product.price_php);

  const skuFormulationDelta = Math.round((skuMarketRegularPrice - brandBenchmarkEquivalent) * 100) / 100;

  // Step 4: Retailer Channel Differential (this retailer's regular price vs market regular price of this SKU)
  const retailerRegularPrice = product.regular_price_php || product.price_php;
  const retailerDelta = Math.round((retailerRegularPrice - skuMarketRegularPrice) * 100) / 100;

  // Step 5: Promotion Adjustment
  const promoDiscount = Math.round((retailerRegularPrice - product.price_php) * 100) / 100;
  const promotionDelta = -promoDiscount;

  // Build steps
  let runningTotal = marketBenchmarkEquivalent;
  const steps: PriceWaterfallStep[] = [
    {
      step_id: 'step-market-benchmark',
      label: 'Market Benchmark Reference',
      category: 'benchmark',
      value_php: marketBenchmarkEquivalent,
      cumulative_php: runningTotal,
      percentage_of_benchmark: 100,
      formula: `Market Median (₱${marketMedian100g.toFixed(2)}/100g) × ${(product.size_value / 100).toFixed(2)}`,
      description: `Equivalent category price at ${product.size_value}${product.size_unit} net content based on market median unit price.`,
      is_available: true
    }
  ];

  // Brand Tier Adjustment
  runningTotal = Math.round((runningTotal + brandPositionDelta) * 100) / 100;
  steps.push({
    step_id: 'step-brand-position',
    label: `Brand Portfolio Delta (${product.brand})`,
    category: 'brand_tier',
    value_php: brandPositionDelta,
    cumulative_php: runningTotal,
    percentage_of_benchmark: marketBenchmarkEquivalent > 0
      ? Math.round((brandPositionDelta / marketBenchmarkEquivalent) * 1000) / 10
      : 0,
    formula: `(Brand Median ₱${brandMedianUnit.toFixed(2)} - Market Median ₱${marketMedian100g.toFixed(2)}) × ${(product.size_value / 100).toFixed(2)}`,
    description: brandPositionDelta >= 0
      ? `Brand carries a positive portfolio premium over the category median.`
      : `Brand sits below the general market median price point.`,
    is_available: true
  });

  // SKU Formulation & Packaging Delta
  runningTotal = Math.round((runningTotal + skuFormulationDelta) * 100) / 100;
  steps.push({
    step_id: 'step-sku-formulation',
    label: `SKU Formulation & Pack Delta (${product.variant})`,
    category: 'sku_formulation',
    value_php: skuFormulationDelta,
    cumulative_php: runningTotal,
    percentage_of_benchmark: marketBenchmarkEquivalent > 0
      ? Math.round((skuFormulationDelta / marketBenchmarkEquivalent) * 1000) / 10
      : 0,
    formula: `SKU Market Regular Price (₱${skuMarketRegularPrice.toFixed(2)}) - Brand Benchmark (₱${brandBenchmarkEquivalent.toFixed(2)})`,
    description: `Specific packaging, active ingredient premium, or multi-benefit formulation differential.`,
    is_available: true
  });

  // Retailer Channel Differential
  runningTotal = Math.round((runningTotal + retailerDelta) * 100) / 100;
  steps.push({
    step_id: 'step-retailer-diff',
    label: `Observed Retailer Channel Delta (${product.retailer})`,
    category: 'channel_differential',
    value_php: retailerDelta,
    cumulative_php: runningTotal,
    percentage_of_benchmark: marketBenchmarkEquivalent > 0
      ? Math.round((retailerDelta / marketBenchmarkEquivalent) * 1000) / 10
      : 0,
    formula: `Retailer Regular Price (₱${retailerRegularPrice.toFixed(2)}) - SKU Market Regular (₱${skuMarketRegularPrice.toFixed(2)})`,
    description: retailerDelta > 0
      ? `Shelf price at ${product.retailer} is observed higher than cross-retailer median regular price.`
      : retailerDelta < 0
      ? `Shelf price at ${product.retailer} is observed lower than cross-retailer median regular price.`
      : `Retailer list price matches cross-channel regular median.`,
    is_available: true
  });

  // Promotion Adjustment (if any)
  if (Math.abs(promotionDelta) > 0.01) {
    runningTotal = Math.round((runningTotal + promotionDelta) * 100) / 100;
    steps.push({
      step_id: 'step-promotion-adj',
      label: `Promotional Markdown (${product.discount_percent.toFixed(1)}% Off)`,
      category: 'promotion_discount',
      value_php: promotionDelta,
      cumulative_php: runningTotal,
      percentage_of_benchmark: marketBenchmarkEquivalent > 0
        ? Math.round((promotionDelta / marketBenchmarkEquivalent) * 1000) / 10
        : 0,
      formula: `- (Regular Price ₱${retailerRegularPrice.toFixed(2)} - Shelf Price ₱${product.price_php.toFixed(2)})`,
      description: `Active point-of-sale temporary price reduction or channel promotional discount.`,
      is_available: true
    });
  }

  // Final Observed Price
  steps.push({
    step_id: 'step-final-price',
    label: 'Observed Shelf Price',
    category: 'final_price',
    value_php: product.price_php,
    cumulative_php: product.price_php,
    percentage_of_benchmark: marketBenchmarkEquivalent > 0
      ? Math.round((product.price_php / marketBenchmarkEquivalent) * 1000) / 10
      : 100,
    formula: `Observed Consumer Checkout Price`,
    description: `Exact price recorded during retail audit at ${product.retailer}.`,
    is_available: true
  });

  const reconciliationDiff = Math.abs(runningTotal - product.price_php);

  return {
    anchor_sku: product,
    retailer_name: product.retailer,
    market_benchmark_reference: marketBenchmarkEquivalent,
    steps,
    observed_shelf_price: product.price_php,
    calculated_reconciliation_diff: Math.round(reconciliationDiff * 100) / 100,
    limitations: [
      'This is an analytical decomposition of observed prices, NOT a causal regression or cost-plus margin model.',
      'Wholesale acquisition costs, trade allowances, and retailer margin structures are unobserved.',
      'Market benchmark equivalents scale linearly by net weight and assume proportional base utility.'
    ]
  };
}
