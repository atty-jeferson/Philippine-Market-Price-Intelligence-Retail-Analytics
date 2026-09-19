/**
 * THE GROCER - Category Configuration & Registry
 * 
 * Manages category-specific attributes, filters, and standard units without hardcoding
 * them into core domain types or analytical engines.
 */

import { UnitOfMeasure, UnitBasis, MarketScope } from './types';

export interface CategoryAttributeDefinition {
  key: string;
  label: string;
  type: 'boolean' | 'string' | 'number' | 'enum';
  description?: string;
  options?: string[];
  hedonicEligible: boolean; // Indicates if attribute can be used in multivariate hedonic price regression
}

export interface CategoryFilterDefinition {
  key: string;
  label: string;
  type: 'boolean' | 'multiselect' | 'range';
}

export interface CategoryPositioningConfig {
  xAxis: { key: string; label: string; min?: number; max?: number };
  yAxis: { key: string; label: string; min?: number; max?: number };
  bubbleMetric: string;
}

export interface CategoryConfig {
  category_id: string;
  display_name: string;
  sector: string;
  default_scope: MarketScope;
  standard_unit: UnitOfMeasure;
  standard_quantity: number;
  unit_label: string; // e.g. "100g", "100ml", "1kg"
  unit_basis: UnitBasis;
  sub_categories: string[];
  attributes: CategoryAttributeDefinition[];
  filters: CategoryFilterDefinition[];
  positioning: CategoryPositioningConfig;
}

/**
 * Toothpaste Category Configuration
 * Contains all the domain-specific attributes that were previously hardcoded in ProductData.
 */
export const TOOTHPASTE_CATEGORY_CONFIG: CategoryConfig = {
  category_id: 'toothpaste',
  display_name: 'Toothpaste',
  sector: 'Oral Care',
  default_scope: {
    country: 'Philippines',
    country_code: 'PH',
    sector: 'FMCG',
    category: 'Oral Care',
    sub_category: 'Toothpaste',
    category_id: 'toothpaste',
    currency: 'PHP',
    currency_symbol: '₱',
    unit_basis: 'weight',
    standard_unit: 'g',
    standard_quantity: 100
  },
  standard_unit: 'g',
  standard_quantity: 100,
  unit_label: '100g',
  unit_basis: 'weight',
  sub_categories: [
    'Cavity Protection',
    'Whitening',
    'Sensitivity Relief',
    'Total Care & Gum Health',
    'Herbal & Natural',
    'Charcoal & Deep Clean',
    'Kids Formulation'
  ],
  attributes: [
    {
      key: 'fluoride',
      label: 'Fluoride Protection',
      type: 'boolean',
      description: 'Contains bioavailable fluoride for enamel re-mineralization and cavity prevention',
      hedonicEligible: true
    },
    {
      key: 'whitening',
      label: 'Whitening Formula',
      type: 'boolean',
      description: 'Formulated with surface stain abrasives or active peroxides for enamel brightening',
      hedonicEligible: true
    },
    {
      key: 'sensitivity',
      label: 'Sensitivity Relief',
      type: 'boolean',
      description: 'Contains potassium nitrate, stannous fluoride, or novamin for dentin desensitization',
      hedonicEligible: true
    },
    {
      key: 'anti_cavity',
      label: 'Anti-Cavity Protection',
      type: 'boolean',
      description: 'Specifically marketed for targeted caries prevention and acid neutralization',
      hedonicEligible: true
    },
    {
      key: 'gum_care',
      label: 'Gum Health / Care',
      type: 'boolean',
      description: 'Contains anti-bacterial agents (e.g. zinc, stannous) for gingival inflammation control',
      hedonicEligible: true
    },
    {
      key: 'herbal',
      label: 'Herbal & Botanical',
      type: 'boolean',
      description: 'Includes natural plant extracts such as clove, neem, green tea, or propolis',
      hedonicEligible: true
    },
    {
      key: 'charcoal',
      label: 'Activated Charcoal',
      type: 'boolean',
      description: 'Contains activated bamboo charcoal particulates for deep surface adsorption',
      hedonicEligible: true
    },
    {
      key: 'kids',
      label: 'Kids Formulation',
      type: 'boolean',
      description: 'Mildly flavored, low-abrasion formula with age-appropriate fluoride calibration',
      hedonicEligible: true
    }
  ],
  filters: [
    { key: 'fluoride', label: 'Fluoride Only', type: 'boolean' },
    { key: 'whitening', label: 'Whitening', type: 'boolean' },
    { key: 'sensitivity', label: 'Sensitivity Relief', type: 'boolean' },
    { key: 'anti_cavity', label: 'Anti-Cavity', type: 'boolean' },
    { key: 'gum_care', label: 'Gum Care', type: 'boolean' },
    { key: 'herbal', label: 'Herbal Extracts', type: 'boolean' },
    { key: 'charcoal', label: 'Charcoal', type: 'boolean' },
    { key: 'kids', label: 'Kids Formula', type: 'boolean' }
  ],
  positioning: {
    xAxis: { key: 'rating', label: 'Consumer Review Score (Stars)', min: 1, max: 5 },
    yAxis: { key: 'price_per_100g', label: 'Normalized Shelf Price (₱ / 100g)' },
    bubbleMetric: 'total_weight_grams'
  }
};

/**
 * Proof of Extensibility: Shampoo Category Configuration (Future Scope)
 */
export const SHAMPOO_CATEGORY_CONFIG: CategoryConfig = {
  category_id: 'shampoo',
  display_name: 'Hair Care - Shampoo',
  sector: 'Personal Care',
  default_scope: {
    country: 'Philippines',
    country_code: 'PH',
    sector: 'FMCG',
    category: 'Hair Care',
    sub_category: 'Shampoo',
    category_id: 'shampoo',
    currency: 'PHP',
    currency_symbol: '₱',
    unit_basis: 'volume',
    standard_unit: 'ml',
    standard_quantity: 100
  },
  standard_unit: 'ml',
  standard_quantity: 100,
  unit_label: '100ml',
  unit_basis: 'volume',
  sub_categories: [
    'Anti-Dandruff',
    'Color Care',
    'Moisturizing & Smooth',
    'Volumizing',
    'Sulfate-Free & Natural'
  ],
  attributes: [
    { key: 'anti_dandruff', label: 'Anti-Dandruff (Zinc/Selenium)', type: 'boolean', hedonicEligible: true },
    { key: 'sulfate_free', label: 'Sulfate-Free', type: 'boolean', hedonicEligible: true },
    { key: 'keratin', label: 'Keratin Infused', type: 'boolean', hedonicEligible: true },
    { key: 'salon_grade', label: 'Professional / Salon Grade', type: 'boolean', hedonicEligible: true }
  ],
  filters: [
    { key: 'anti_dandruff', label: 'Anti-Dandruff', type: 'boolean' },
    { key: 'sulfate_free', label: 'Sulfate-Free', type: 'boolean' },
    { key: 'keratin', label: 'Keratin', type: 'boolean' }
  ],
  positioning: {
    xAxis: { key: 'rating', label: 'Consumer Review Score (Stars)', min: 1, max: 5 },
    yAxis: { key: 'price_per_100ml', label: 'Normalized Shelf Price (₱ / 100ml)' },
    bubbleMetric: 'volume_ml'
  }
};

/**
 * Category Registry singleton map
 */
const registry: Map<string, CategoryConfig> = new Map([
  [TOOTHPASTE_CATEGORY_CONFIG.category_id, TOOTHPASTE_CATEGORY_CONFIG],
  [SHAMPOO_CATEGORY_CONFIG.category_id, SHAMPOO_CATEGORY_CONFIG]
]);

export function getCategoryConfig(categoryId: string): CategoryConfig {
  const config = registry.get(categoryId.toLowerCase());
  return config || TOOTHPASTE_CATEGORY_CONFIG;
}

export function getAllRegisteredCategories(): CategoryConfig[] {
  return Array.from(registry.values());
}

export function registerCategory(config: CategoryConfig): void {
  registry.set(config.category_id.toLowerCase(), config);
}

export function getDefaultCategory(): CategoryConfig {
  return TOOTHPASTE_CATEGORY_CONFIG;
}
