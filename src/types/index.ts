export type SizeUnit = 'g' | 'ml';

import type { RegressionDiagnosticStatus } from '../domain/statistics';

// Re-export Category-Agnostic Domain Model, Category Registry & Adapters
export * from '../domain';

export type RetailerType = 'Pharmacy / Health' | 'Supermarket / Hypermarket' | 'E-Commerce Marketplace';

export type PositioningTier = 'Budget' | 'Mainstream' | 'Premium' | 'Specialty' | 'Unknown';

export type OriginType = 'Local' | 'Imported' | 'Unknown';

export type PersonaMode = 'shopper' | 'researcher' | 'analyst';

export type TabType = 
  | 'landing'
  | 'home'
  | 'overview'
  | 'competitive'
  | 'explorer'
  | 'compare'
  | 'positioning'
  | 'brands'
  | 'brand_architecture'
  | 'retailers'
  | 'channel_architecture'
  | 'opportunities'
  | 'trends'
  | 'economics'
  | 'methodology';

export interface HistoricalPricePoint {
  date: string; // YYYY-MM-DD
  price_php: number;
  regular_price_php?: number;
  sale_price_php?: number | null;
  retailer: string;
}

export interface ProductData {
  product_id: string;
  brand: string;
  product_name: string;
  variant: string;
  category: string;
  sub_category: string;
  size_value: number;
  size_unit: SizeUnit;
  weight_grams: number;
  volume_ml: number | null;
  is_multipack: boolean;
  multipack_count: number;
  price_php: number;
  regular_price_php: number;
  sale_price_php: number | null;
  discount_percent: number;
  retailer: string;
  retailer_type: RetailerType;
  location: string;
  date_collected: string;
  product_url: string;
  rating?: number;
  review_count?: number;
  fluoride: boolean;
  whitening: boolean;
  sensitivity: boolean;
  anti_cavity: boolean;
  gum_care: boolean;
  herbal: boolean;
  charcoal: boolean;
  kids: boolean;
  premium_positioning: PositioningTier;
  origin: OriginType;
  source: string;
  is_demo?: boolean;
  is_on_promotion?: boolean;
  historical_prices?: HistoricalPricePoint[];
}

export interface NormalizedProduct extends ProductData {
  price_per_gram: number;
  price_per_100g: number;
  price_per_ml: number | null;
  price_per_100ml: number | null;
  total_weight_grams: number;
  total_volume_ml: number | null;
  price_index: number; // 100 = market median
  value_score: number; // 0-100 score
  relative_percent_vs_median: number; // e.g. -28% or +18%
}

export interface ValueScoreWeights {
  unitPriceAdvantage: number; // default: 40%
  productRating: number;      // default: 20%
  discount: number;           // default: 15%
  featureCoverage: number;    // default: 15%
  brandPositioning: number;   // default: 10%
}

export interface MarketSummaryKPIs {
  medianMarketPrice: number;
  medianPricePer100g: number;
  meanPricePer100g: number;
  lowestUnitPrice: { product: NormalizedProduct; pricePer100g: number };
  highestUnitPrice: { product: NormalizedProduct; pricePer100g: number };
  totalProducts: number;
  totalBrands: number;
  totalRetailers: number;
  promotionRate: number; // e.g. 24.5%
  avgDiscountPercent: number;
  stdDevPricePer100g: number;
  coefficientOfVariation: number; // (std / mean) * 100
  iqrPricePer100g: number;
  q1PricePer100g: number;
  q3PricePer100g: number;
  minPricePer100g: number;
  maxPricePer100g: number;
}

export interface BrandMetric {
  brand: string;
  productCount: number;
  presenceShare: number; // % of total observed SKUs (NOT market share)
  medianPricePer100g: number;
  meanPricePer100g: number;
  stdDevPricePer100g: number;
  ciLower: number;
  ciUpper: number;
  tCritical?: number;
  df?: number;
  marketPremiumPercent: number; // (brandMedian - marketMedian) / marketMedian * 100
  avgRating: number;
  primaryTier: PositioningTier;
  sampleVariants: string[];
}

export interface RetailerMetric {
  retailer: string;
  retailerType: RetailerType;
  skuCount: number;
  medianPricePer100g: number;
  meanPricePer100g: number;
  retailerPriceIndex: number; // 100 = market median
  avgDiscountPercent: number;
  promoCount: number;
  locations: string[];
}

export interface CrossRetailerSKUComparison {
  canonicalName: string;
  brand: string;
  size: string;
  weightGrams: number;
  retailers: {
    retailer: string;
    price: number;
    pricePer100g: number;
    isOnSale: boolean;
    discountPercent: number;
  }[];
  minPrice: number;
  maxPrice: number;
  absoluteGap: number;
  percentageGap: number;
  cheapestRetailer: string;
  priciestRetailer: string;
}

export interface RegressionResult {
  independentVariable: string;
  dependentVariable: string;
  n: number;
  k?: number;
  df?: number;
  dfResidual?: number;
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  fStatistic: number;
  pValueF: number;
  status?: RegressionDiagnosticStatus;
  statusMessage?: string;
  coefficients: {
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
  }[];
  plainLanguageSummary: string[];
  caveats: string[];
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  excludedRows: number;
  duplicatesRemoved: number;
  qualityScorePercent: number; // 0 - 100
  issuesFound: string[];
  missingSizeCount: number;
  missingPriceCount: number;
  suspiciousPriceCount: number;
}

// Convenience Type Aliases for Backward & Ergonomic Compatibility
export type UserPersona = PersonaMode;
export type ToothpasteProduct = ProductData;
export type ValueWeights = ValueScoreWeights;
export type EconometricRegressionResult = RegressionResult;
export type HedonicRegressionResult = RegressionResult;
