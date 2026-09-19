/**
 * THE GROCER - Schema Mapping Layer
 * 
 * Provides an explicit mapping registry between disparate raw CSV/scrape column headers
 * and canonical domain attributes.
 * 
 * Avoids uncontrolled synonym sprawl by utilizing a curated, deterministic alias dictionary.
 */

import { CategoryConfig } from './categoryConfig';

export type CanonicalFieldKey =
  | 'brand'
  | 'product_name'
  | 'variant'
  | 'sku_id'
  | 'barcode_ean'
  | 'shelf_price'
  | 'regular_price'
  | 'sale_price'
  | 'retailer'
  | 'store'
  | 'observed_date'
  | 'net_content'
  | 'unit_of_measure'
  | 'multipack_units'
  | 'is_multipack'
  | 'rating'
  | 'review_count'
  | 'origin'
  | 'tier'
  | 'category_attribute';

export interface FieldMappingRule {
  canonicalKey: CanonicalFieldKey;
  label: string;
  required: boolean;
  aliases: string[];
  attributeKey?: string; // If canonicalKey === 'category_attribute'
  transform?: (val: string) => any;
}

/**
 * Curated Canonical Header Mapping Registry
 */
export const CANONICAL_FIELD_REGISTRY: FieldMappingRule[] = [
  {
    canonicalKey: 'brand',
    label: 'Brand Name',
    required: true,
    aliases: ['brand', 'brand_name', 'brandname', 'manufacturer_brand', 'brand_title', 'brand_label', 'manufacturer']
  },
  {
    canonicalKey: 'product_name',
    label: 'Product Name',
    required: true,
    aliases: ['product_name', 'productname', 'product', 'item_name', 'itemname', 'title', 'item_description', 'product_title']
  },
  {
    canonicalKey: 'variant',
    label: 'Formulation / Variant',
    required: false,
    aliases: ['variant', 'flavor', 'flavour', 'formulation', 'sub_name', 'subname', 'variant_name', 'type_variant']
  },
  {
    canonicalKey: 'sku_id',
    label: 'Canonical SKU ID',
    required: false,
    aliases: ['sku_id', 'skuid', 'sku', 'item_code', 'itemcode', 'product_code', 'catalog_id']
  },
  {
    canonicalKey: 'barcode_ean',
    label: 'Barcode (GTIN / EAN / UPC)',
    required: false,
    aliases: ['barcode_ean', 'barcode', 'ean', 'gtin', 'upc', 'ean13', 'gtin13', 'upca']
  },
  {
    canonicalKey: 'shelf_price',
    label: 'Observed Shelf Price (₱)',
    required: true,
    aliases: ['price_php', 'price', 'shelf_price', 'selling_price', 'current_price', 'final_price', 'price_current', 'retail_price']
  },
  {
    canonicalKey: 'regular_price',
    label: 'Regular / Base Price (₱)',
    required: false,
    aliases: ['regular_price_php', 'regular_price', 'original_price', 'srp', 'list_price', 'base_price', 'normal_price']
  },
  {
    canonicalKey: 'sale_price',
    label: 'Sale Price (₱)',
    required: false,
    aliases: ['sale_price_php', 'sale_price', 'promo_price', 'discounted_price', 'promotional_price']
  },
  {
    canonicalKey: 'retailer',
    label: 'Retailer / Banner',
    required: true,
    aliases: ['retailer', 'retailer_name', 'store_name', 'channel', 'seller', 'merchant', 'shop', 'vendor']
  },
  {
    canonicalKey: 'store',
    label: 'Store Branch / Outlet Location',
    required: false,
    aliases: ['store', 'branch', 'outlet', 'location', 'store_branch', 'outlet_location']
  },
  {
    canonicalKey: 'observed_date',
    label: 'Observation Date',
    required: true,
    aliases: ['date_collected', 'date', 'observed_date', 'collected_date', 'timestamp', 'audit_date', 'scrape_date']
  },
  {
    canonicalKey: 'net_content',
    label: 'Net Content (Size / Weight)',
    required: true,
    aliases: ['size_value', 'size', 'net_content', 'weight_grams', 'weight', 'net_weight', 'volume_ml', 'grams', 'volume', 'content_size']
  },
  {
    canonicalKey: 'unit_of_measure',
    label: 'Unit of Measure (UOM)',
    required: false,
    aliases: ['size_unit', 'unit', 'uom', 'unit_of_measure', 'measurement_unit', 'unit_type']
  },
  {
    canonicalKey: 'multipack_units',
    label: 'Multipack Quantity (Pack Count)',
    required: false,
    aliases: ['multipack_count', 'pack_quantity', 'pack_count', 'units_per_pack', 'multipack_units', 'bundle_units', 'quantity_per_pack']
  },
  {
    canonicalKey: 'is_multipack',
    label: 'Multipack Flag',
    required: false,
    aliases: ['is_multipack', 'multipack', 'is_bundle', 'bundle', 'twin_pack']
  },
  {
    canonicalKey: 'rating',
    label: 'Customer Star Rating',
    required: false,
    aliases: ['rating', 'stars', 'review_rating', 'user_rating', 'score']
  },
  {
    canonicalKey: 'review_count',
    label: 'Review Count',
    required: false,
    aliases: ['review_count', 'reviews', 'number_of_reviews', 'rating_count', 'total_reviews']
  },
  {
    canonicalKey: 'tier',
    label: 'Positioning Tier',
    required: false,
    aliases: ['premium_positioning', 'tier', 'positioning_tier', 'market_tier', 'segment']
  },
  {
    canonicalKey: 'origin',
    label: 'Origin (Local / Imported)',
    required: false,
    aliases: ['origin', 'origin_type', 'source_origin', 'country_origin']
  }
];

export interface ColumnMappingResult {
  headerIndex: number;
  rawHeader: string;
  normalizedHeader: string;
  matchedField: FieldMappingRule | null;
  matchType: 'exact' | 'alias' | 'category_attribute' | 'unmapped';
  confidence: number; // 0.0 to 1.0
}

export interface SchemaInspectionReport {
  rawHeaders: string[];
  mappings: ColumnMappingResult[];
  mappedCanonicalKeys: Set<CanonicalFieldKey>;
  missingRequiredKeys: CanonicalFieldKey[];
  isViable: boolean; // True if all required canonical keys are present or synthesizable
}

/**
 * Normalizes header strings for comparison against alias registry
 */
export function normalizeHeaderString(header: string): string {
  if (!header) return '';
  return header
    .toLowerCase()
    .trim()
    .replace(/[^\w]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Inspects raw headers and automatically resolves canonical field mappings
 */
export function inspectAndMapHeaders(
  rawHeaders: string[],
  categoryConfig?: CategoryConfig
): SchemaInspectionReport {
  const mappings: ColumnMappingResult[] = [];
  const mappedCanonicalKeys = new Set<CanonicalFieldKey>();

  rawHeaders.forEach((rawHeader, idx) => {
    const norm = normalizeHeaderString(rawHeader);
    const compactNorm = norm.replace(/_/g, '');

    // 1. Check canonical fields & aliases
    let matchedRule: FieldMappingRule | null = null;
    let matchType: 'exact' | 'alias' | 'category_attribute' | 'unmapped' = 'unmapped';
    let confidence = 0;

    for (const rule of CANONICAL_FIELD_REGISTRY) {
      if (rule.aliases.includes(norm) || rule.aliases.map((a) => a.replace(/_/g, '')).includes(compactNorm)) {
        matchedRule = rule;
        matchType = rule.canonicalKey === norm ? 'exact' : 'alias';
        confidence = matchType === 'exact' ? 1.0 : 0.9;
        break;
      }
    }

    // 2. If not matched, check category-specific attributes (e.g. fluoride, whitening)
    if (!matchedRule && categoryConfig) {
      for (const attr of categoryConfig.attributes) {
        const attrNorm = normalizeHeaderString(attr.key);
        if (norm === attrNorm || compactNorm === attrNorm.replace(/_/g, '')) {
          matchedRule = {
            canonicalKey: 'category_attribute',
            label: attr.label,
            required: false,
            aliases: [attr.key],
            attributeKey: attr.key
          };
          matchType = 'category_attribute';
          confidence = 0.95;
          break;
        }
      }
    }

    if (matchedRule) {
      mappedCanonicalKeys.add(matchedRule.canonicalKey);
    }

    mappings.push({
      headerIndex: idx,
      rawHeader,
      normalizedHeader: norm,
      matchedField: matchedRule,
      matchType,
      confidence
    });
  });

  // Check required keys: brand, product_name, shelf_price, retailer, observed_date, net_content
  const requiredKeys: CanonicalFieldKey[] = CANONICAL_FIELD_REGISTRY
    .filter((r) => r.required)
    .map((r) => r.canonicalKey);

  const missingRequiredKeys = requiredKeys.filter((req) => !mappedCanonicalKeys.has(req));

  return {
    rawHeaders,
    mappings,
    mappedCanonicalKeys,
    missingRequiredKeys,
    isViable: missingRequiredKeys.length === 0
  };
}
