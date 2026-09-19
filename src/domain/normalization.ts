/**
 * THE GROCER - Normalization Engine
 * 
 * Computes standardized unit pricing based on MarketScope and CategoryConfig.
 * 
 * MATHEMATICAL SPECIFICATION:
 * 
 * 1. Multipack Total Quantity Calculation:
 *    Let N = multipack_units (count of physical packaged items in the sellable bundle, minimum 1)
 *    Let Q = net_content (nominal mass or volume of each individual unit)
 *    Total Sellable Quantity: Q_total = N * Q
 * 
 * 2. Standardized Unit Price Calculation:
 *    Let P_shelf = Observed Shelf Price (currency PHP)
 *    Let S = category standard quantity (e.g. 100 for 100g / 100ml; 1000 for 1kg / 1L; 1 for count)
 *    
 *    Unit Price (₱ / Standard Basis) = (P_shelf / Q_total) * S
 * 
 * 3. Unit Conversions:
 *    - Grams (g) -> Standard 100g: scale factor = 100
 *    - Kilograms (kg) -> Standard 100g: Q_total in grams = Q_total * 1000, then scale by 100
 *    - Milliliters (ml) -> Standard 100ml: scale factor = 100
 *    - Liters (l) -> Standard 100ml: Q_total in ml = Q_total * 1000, then scale by 100
 *    - Count / Sachet / Piece -> Standard Piece (S = 1): Unit Price = P_shelf / Q_total
 * 
 * 4. Evidence Classification:
 *    - Shelf Price: 'Observed'
 *    - Regular Price: 'Observed' (if directly reported) or 'Inferred' (if backfilled from shelf price)
 *    - Standardized Unit Price: 'Derived'
 *    - Promotional Discount %: 'Derived'
 */

import { CategoryConfig, TOOTHPASTE_CATEGORY_CONFIG } from './categoryConfig';
import { UnitOfMeasure, EvidenceStatus } from './types';

export interface NormalizationInput {
  shelf_price: number;
  regular_price: number;
  net_content: number;
  unit_of_measure: UnitOfMeasure | string;
  multipack_units?: number;
  categoryConfig?: CategoryConfig;
}

export interface NormalizationResult {
  total_net_content: number;
  standardized_unit: UnitOfMeasure;
  standardized_quantity: number;
  unit_label: string;
  price_per_standard_unit: number;
  regular_price_per_standard_unit: number;
  evidence_status: {
    shelf_price: EvidenceStatus;
    unit_price: EvidenceStatus;
    regular_price: EvidenceStatus;
  };
  calculation_metadata: {
    pack_count: number;
    single_unit_content: number;
    raw_uom: string;
    conversion_multiplier: number;
    formula_applied: string;
  };
}

/**
 * Normalizes any package size and multipack into standardized unit economics
 */
export function normalizeProductPricing(
  input: NormalizationInput
): NormalizationResult {
  const config = input.categoryConfig || TOOTHPASTE_CATEGORY_CONFIG;
  const packCount = Math.max(1, input.multipack_units || 1);
  const singleContent = Math.max(0.001, input.net_content);
  const rawUom = (input.unit_of_measure || config.standard_unit).toLowerCase().trim();

  // 1. Convert to base metric scale (grams, ml, or pieces)
  let baseMetricTotal = singleContent * packCount;
  let conversionMultiplier = 1;

  if (rawUom === 'kg') {
    conversionMultiplier = 1000;
    baseMetricTotal = singleContent * 1000 * packCount;
  } else if (rawUom === 'l') {
    conversionMultiplier = 1000;
    baseMetricTotal = singleContent * 1000 * packCount;
  }

  // 2. Compute standardized price per benchmark quantity (e.g. per 100g, 100ml, 1kg, 1pc)
  const S = config.standard_quantity;
  const unitPrice = (input.shelf_price / baseMetricTotal) * S;
  const regularUnitPrice = (input.regular_price / baseMetricTotal) * S;

  const formula = `(${input.shelf_price.toFixed(2)} / (${packCount} × ${singleContent}${rawUom})) × ${S}${config.standard_unit}`;

  return {
    total_net_content: baseMetricTotal,
    standardized_unit: config.standard_unit,
    standardized_quantity: config.standard_quantity,
    unit_label: config.unit_label,
    price_per_standard_unit: Math.round(unitPrice * 100) / 100,
    regular_price_per_standard_unit: Math.round(regularUnitPrice * 100) / 100,
    evidence_status: {
      shelf_price: 'Observed',
      unit_price: 'Derived',
      regular_price: input.regular_price !== input.shelf_price ? 'Observed' : 'Inferred'
    },
    calculation_metadata: {
      pack_count: packCount,
      single_unit_content: singleContent,
      raw_uom: rawUom,
      conversion_multiplier: conversionMultiplier,
      formula_applied: formula
    }
  };
}
