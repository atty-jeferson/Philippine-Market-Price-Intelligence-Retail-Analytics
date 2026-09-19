/**
 * THE GROCER - Phase 4 Dedicated Analytical Signal Engine
 * 
 * Concept:
 * Fully deterministic, auditable market intelligence signal generator.
 * Every signal points strictly to the exact observations and empirical metrics that triggered it.
 * No hardcoded alerts. No black-box scoring.
 */

import { NormalizedProduct } from '../types';
import { EvidenceStatus } from './types';

export type SignalType =
  | 'PRICE_PREMIUM_ELEVATED'
  | 'PRICE_DISCOUNT_DEEP'
  | 'CROSS_CHANNEL_DISPERSION'
  | 'BENCHMARK_INDEX_OUTLIER'
  | 'PACK_SIZE_ECONOMICS_INVERSION'
  | 'UNPROMOTED_MARGIN_RISK';

export type SignalSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type SignalState = 'ACTIVE' | 'RESOLVED' | 'HISTORICAL';

export interface SignalThresholds {
  min_discount_percent_deep: number;        // Default 20%
  min_premium_percent_elevated: number;     // Default 25%
  min_channel_dispersion_percent: number;   // Default 15%
  benchmark_index_high: number;             // Default 130
  benchmark_index_low: number;              // Default 70
}

export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholds = {
  min_discount_percent_deep: 20,
  min_premium_percent_elevated: 25,
  min_channel_dispersion_percent: 15,
  benchmark_index_high: 130,
  benchmark_index_low: 70
};

export interface MarketSignal {
  signal_id: string;
  signal_type: SignalType;
  entity_type: 'sku' | 'brand' | 'retailer';
  entity_id: string;
  entity_name: string;
  observed_date: string;
  state: SignalState;
  severity: SignalSeverity;
  metric_name: string;
  trigger_value: number;
  threshold_value: number;
  trigger_formula: string;
  confidence_score: number;               // 0.0 to 1.0 based on sample depth and observational freshness
  evidence_status: EvidenceStatus;
  observation_ids: string[];
  retailer_names: string[];
  explanation: string;
  commercial_thesis: string;
  audit_metadata: {
    calculated_at: string;
    sample_size: number;
    parameters: Record<string, number | string>;
  };
}

/**
 * Deterministically generates all market intelligence signals for a product catalogue.
 */
export function generateMarketSignals(
  products: NormalizedProduct[],
  marketMedian100g: number,
  customThresholds: Partial<SignalThresholds> = {}
): MarketSignal[] {
  const thresholds: SignalThresholds = {
    ...DEFAULT_SIGNAL_THRESHOLDS,
    ...customThresholds
  };

  const signals: MarketSignal[] = [];
  const nowStr = new Date().toISOString().split('T')[0];

  if (!products || products.length === 0 || marketMedian100g <= 0) {
    return signals;
  }

  // Group products by canonical SKU representation (brand + size_value + variant)
  const skuGroups = new Map<string, NormalizedProduct[]>();
  products.forEach((p) => {
    const key = `${p.brand.toLowerCase()}-${p.size_value}-${p.variant.toLowerCase()}`;
    const group = skuGroups.get(key) || [];
    group.push(p);
    skuGroups.set(key, group);
  });

  // Signal Generator 1: DEEP PROMOTIONS
  products.forEach((p) => {
    const isOnPromotion = Boolean(p.is_on_promotion || (p.discount_percent > 0) || (p.sale_price_php !== null && p.sale_price_php !== undefined && p.sale_price_php < p.regular_price_php));
    if (isOnPromotion && p.discount_percent >= thresholds.min_discount_percent_deep) {
      const discount = Math.round(p.discount_percent * 10) / 10;
      const nominalSavings = Math.round((p.regular_price_php - p.price_php) * 100) / 100;
      
      signals.push({
        signal_id: `sig-promo-${p.product_id}`,
        signal_type: 'PRICE_DISCOUNT_DEEP',
        entity_type: 'sku',
        entity_id: p.product_id,
        entity_name: `${p.brand} ${p.product_name} (${p.size_value}${p.size_unit})`,
        observed_date: p.date_collected || nowStr,
        state: 'ACTIVE',
        severity: discount >= 35 ? 'HIGH' : 'MEDIUM',
        metric_name: 'discount_percent',
        trigger_value: discount,
        threshold_value: thresholds.min_discount_percent_deep,
        trigger_formula: `((₱${p.regular_price_php.toFixed(2)} - ₱${p.price_php.toFixed(2)}) / ₱${p.regular_price_php.toFixed(2)}) * 100`,
        confidence_score: 1.0, // Direct shelf observation
        evidence_status: 'Observed',
        observation_ids: [p.product_id],
        retailer_names: [p.retailer],
        explanation: `Observed discount of ${discount}% (₱${nominalSavings.toFixed(2)} markdown) at ${p.retailer} meets or exceeds the deep-discount threshold (${thresholds.min_discount_percent_deep}%).`,
        commercial_thesis: `Shelf markdowns exceeding ${thresholds.min_discount_percent_deep}% typically indicate short-term retailer traffic driver execution or inventory clearance. Monitor whether baseline volume recovers post-promotion.`,
        audit_metadata: {
          calculated_at: nowStr,
          sample_size: 1,
          parameters: {
            regular_price: p.regular_price_php,
            shelf_price: p.price_php,
            retailer: p.retailer
          }
        }
      });
    }
  });

  // Signal Generator 2: CROSS-CHANNEL DISPERSION (Same SKU sold at different retailers)
  skuGroups.forEach((group, skuKey) => {
    if (group.length >= 2) {
      const prices = group.map((p) => p.price_php);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const spreadPhp = Math.round((maxPrice - minPrice) * 100) / 100;
      const spreadPct = minPrice > 0 ? Math.round(((maxPrice - minPrice) / minPrice) * 1000) / 10 : 0;

      if (spreadPct >= thresholds.min_channel_dispersion_percent) {
        const cheapest = group.find((p) => p.price_php === minPrice)!;
        const dearest = group.find((p) => p.price_php === maxPrice)!;
        const rep = group[0];

        signals.push({
          signal_id: `sig-dispersion-${skuKey}`,
          signal_type: 'CROSS_CHANNEL_DISPERSION',
          entity_type: 'sku',
          entity_id: rep.product_id,
          entity_name: `${rep.brand} ${rep.product_name} (${rep.size_value}${rep.size_unit})`,
          observed_date: rep.date_collected || nowStr,
          state: 'ACTIVE',
          severity: spreadPct >= 25 ? 'HIGH' : 'MEDIUM',
          metric_name: 'channel_price_spread_percent',
          trigger_value: spreadPct,
          threshold_value: thresholds.min_channel_dispersion_percent,
          trigger_formula: `((₱${maxPrice.toFixed(2)} - ₱${minPrice.toFixed(2)}) / ₱${minPrice.toFixed(2)}) * 100`,
          confidence_score: Math.min(1.0, 0.6 + (group.length * 0.1)),
          evidence_status: 'Derived',
          observation_ids: group.map((p) => p.product_id),
          retailer_names: Array.from(new Set(group.map((p) => p.retailer))),
          explanation: `Identical physical SKU exhibits a ${spreadPct}% price variance across channels (₱${minPrice.toFixed(2)} at ${cheapest.retailer} vs ₱${maxPrice.toFixed(2)} at ${dearest.retailer}).`,
          commercial_thesis: `Cross-retailer price divergence of ${spreadPct}% creates consumer arbitrage incentive and indicates channel compliance asymmetry or divergent channel tiering strategies.`,
          audit_metadata: {
            calculated_at: nowStr,
            sample_size: group.length,
            parameters: {
              cheapest_retailer: cheapest.retailer,
              cheapest_price: minPrice,
              priciest_retailer: dearest.retailer,
              priciest_price: maxPrice
            }
          }
        });
      }
    }
  });

  // Signal Generator 3: BENCHMARK PRICE INDEX OUTLIERS (PCI)
  products.forEach((p) => {
    if (marketMedian100g > 0 && p.price_per_100g > 0) {
      const pci = Math.round((p.price_per_100g / marketMedian100g) * 100);

      if (pci >= thresholds.benchmark_index_high) {
        signals.push({
          signal_id: `sig-pci-high-${p.product_id}`,
          signal_type: 'BENCHMARK_INDEX_OUTLIER',
          entity_type: 'sku',
          entity_id: p.product_id,
          entity_name: `${p.brand} ${p.product_name} (${p.size_value}${p.size_unit})`,
          observed_date: p.date_collected || nowStr,
          state: 'ACTIVE',
          severity: pci >= 170 ? 'HIGH' : 'MEDIUM',
          metric_name: 'price_competitiveness_index',
          trigger_value: pci,
          threshold_value: thresholds.benchmark_index_high,
          trigger_formula: `(₱${p.price_per_100g.toFixed(2)} / ₱${marketMedian100g.toFixed(2)}) * 100`,
          confidence_score: 0.95,
          evidence_status: 'Derived',
          observation_ids: [p.product_id],
          retailer_names: [p.retailer],
          explanation: `Unit price index of ${pci} exceeds category median benchmark threshold of ${thresholds.benchmark_index_high} (+${pci - 100}% category premium).`,
          commercial_thesis: `SKU commands substantial premium over median category index. Requires validated brand equity or clinical differentiation to prevent consumer trade-down to mainstream alternatives.`,
          audit_metadata: {
            calculated_at: nowStr,
            sample_size: 1,
            parameters: {
              sku_unit_price: p.price_per_100g,
              category_median_unit_price: marketMedian100g
            }
          }
        });
      } else if (pci <= thresholds.benchmark_index_low) {
        signals.push({
          signal_id: `sig-pci-low-${p.product_id}`,
          signal_type: 'BENCHMARK_INDEX_OUTLIER',
          entity_type: 'sku',
          entity_id: p.product_id,
          entity_name: `${p.brand} ${p.product_name} (${p.size_value}${p.size_unit})`,
          observed_date: p.date_collected || nowStr,
          state: 'ACTIVE',
          severity: 'LOW',
          metric_name: 'price_competitiveness_index',
          trigger_value: pci,
          threshold_value: thresholds.benchmark_index_low,
          trigger_formula: `(₱${p.price_per_100g.toFixed(2)} / ₱${marketMedian100g.toFixed(2)}) * 100`,
          confidence_score: 0.95,
          evidence_status: 'Derived',
          observation_ids: [p.product_id],
          retailer_names: [p.retailer],
          explanation: `Unit price index of ${pci} sits well below category median benchmark threshold of ${thresholds.benchmark_index_low} (-${100 - pci}% category discount).`,
          commercial_thesis: `SKU offers strong price accessibility or entry-level positioning, capturing budget-conscious volume at potentially compressed gross margin.`,
          audit_metadata: {
            calculated_at: nowStr,
            sample_size: 1,
            parameters: {
              sku_unit_price: p.price_per_100g,
              category_median_unit_price: marketMedian100g
            }
          }
        });
      }
    }
  });

  // Signal Generator 4: PACK SIZE ECONOMICS INVERSION
  // Check if within the same brand and variant, a larger pack has a HIGHER unit price than a smaller pack
  const brandVariantGroups = new Map<string, NormalizedProduct[]>();
  products.forEach((p) => {
    const key = `${p.brand.toLowerCase()}-${p.variant.toLowerCase()}`;
    const group = brandVariantGroups.get(key) || [];
    group.push(p);
    brandVariantGroups.set(key, group);
  });

  brandVariantGroups.forEach((group, key) => {
    if (group.length >= 2) {
      // Sort by package size ascending
      const sortedBySize = [...group].sort((a, b) => a.size_value - b.size_value);
      for (let i = 0; i < sortedBySize.length - 1; i++) {
        const smaller = sortedBySize[i];
        const larger = sortedBySize[i + 1];
        
        // If larger pack is strictly larger by >= 20%
        if (larger.size_value >= smaller.size_value * 1.2) {
          // Check if larger pack has a higher unit price
          if (larger.price_per_100g > smaller.price_per_100g * 1.05) {
            const unitDiffPct = Math.round(((larger.price_per_100g - smaller.price_per_100g) / smaller.price_per_100g) * 1000) / 10;
            
            signals.push({
              signal_id: `sig-inversion-${smaller.product_id}-${larger.product_id}`,
              signal_type: 'PACK_SIZE_ECONOMICS_INVERSION',
              entity_type: 'sku',
              entity_id: larger.product_id,
              entity_name: `${larger.brand} ${larger.product_name} (${larger.size_value}${larger.size_unit})`,
              observed_date: larger.date_collected || nowStr,
              state: 'ACTIVE',
              severity: 'HIGH',
              metric_name: 'size_unit_price_premium_percent',
              trigger_value: unitDiffPct,
              threshold_value: 0,
              trigger_formula: `((₱${larger.price_per_100g.toFixed(2)} - ₱${smaller.price_per_100g.toFixed(2)}) / ₱${smaller.price_per_100g.toFixed(2)}) * 100`,
              confidence_score: 0.9,
              evidence_status: 'Derived',
              observation_ids: [smaller.product_id, larger.product_id],
              retailer_names: Array.from(new Set([smaller.retailer, larger.retailer])),
              explanation: `Volume discount curve inverted: larger pack (${larger.size_value}${larger.size_unit}) costs ${unitDiffPct}% MORE per 100g (₱${larger.price_per_100g.toFixed(2)}) than smaller pack (${smaller.size_value}${smaller.size_unit} at ₱${smaller.price_per_100g.toFixed(2)}).`,
              commercial_thesis: `Package size curve inversion penalizes bulk purchasers and undermines volume trade-up incentives. May stem from asynchronous retailer promo cadences or uncoordinated pack tier list pricing.`,
              audit_metadata: {
                calculated_at: nowStr,
                sample_size: 2,
                parameters: {
                  smaller_size: smaller.size_value,
                  smaller_unit_price: smaller.price_per_100g,
                  larger_size: larger.size_value,
                  larger_unit_price: larger.price_per_100g
                }
              }
            });
          }
        }
      }
    }
  });

  return signals;
}
