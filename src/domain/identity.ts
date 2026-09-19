/**
 * THE GROCER - Identity Resolution Engine
 * 
 * Establishes canonical identities for Brands, Products, SKUs, and Retail Outlets.
 * 
 * IDENTITY HIERARCHY FOR SKUS:
 * 1. GTIN / EAN-13 / UPC Barcode (when available) - Globally unique trade item identification
 * 2. Explicit Canonical SKU ID (when supplied by authoritative catalog or scrape source)
 * 3. Deterministic Normalized Composite Identity (fallback):
 *    Normalized Brand + Normalized Product Line + Normalized Formulation/Variant + Net Content + UOM + Multipack Count
 * 
 * DISTINCTION OF CONCEPTS:
 * - Product Identity: Canonical consumer formulation (e.g. "Colgate Total 12 Clean Mint")
 * - SKU Identity: The physical packaged item (e.g. "Colgate Total 12 Clean Mint 150g Single Tube")
 * - Retail Listing / Observation: The same physical SKU observed at a specific retailer (e.g. Watsons vs SM vs Mercury Drug)
 * 
 * RULE: The same physical SKU sold at 4 different retailers MUST resolve to 1 single canonical SKU,
 * with 4 distinct PriceObservations.
 * Conversely, two genuinely different pack sizes (e.g. 100g vs 150g) MUST NOT be merged.
 * Ambiguous identities are flagged for review, never merged via fuzzy guesses.
 */

import { UnitOfMeasure } from './types';

export interface IdentityResolutionInput {
  barcode_ean?: string;
  sku_id?: string;
  brand: string;
  product_name: string;
  variant?: string;
  net_content: number;
  unit_of_measure: UnitOfMeasure;
  multipack_units?: number;
}

export interface ResolvedSKUIdentity {
  canonical_sku_id: string;
  canonical_product_id: string;
  canonical_brand_id: string;
  resolution_method: 'barcode_gtin' | 'explicit_id' | 'composite_deterministic';
  confidence: 'high' | 'provisional';
  barcode_ean?: string;
  normalized_brand: string;
  normalized_product_name: string;
  normalized_variant: string;
  is_ambiguous: boolean;
  ambiguity_reason?: string;
}

/**
 * Normalizes text for deterministic identity matching:
 * - Lowercases and trims
 * - Collapses consecutive whitespace
 * - Replaces non-alphanumeric separators with single dashes
 * - Strips leading/trailing punctuation
 */
export function normalizeIdentityString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Cleans human-readable brand names for consistent presentation
 */
export function cleanBrandName(raw: string): string {
  if (!raw) return 'Generic Brand';
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  // Title case if entirely uppercase or lowercase
  if (trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
  }
  return trimmed;
}

/**
 * Resolves canonical brand identity
 */
export function resolveBrandIdentity(rawBrand: string): { brand_id: string; brand_name: string } {
  const brand_name = cleanBrandName(rawBrand);
  const brand_id = normalizeIdentityString(brand_name) || 'generic-brand';
  return { brand_id, brand_name };
}

/**
 * Resolves canonical product formulation identity (independent of packaging size)
 */
export function resolveProductIdentity(
  brandId: string,
  rawProductName: string,
  rawVariant: string = ''
): { product_id: string; clean_product_name: string; clean_variant: string } {
  const clean_product_name = rawProductName ? rawProductName.trim().replace(/\s+/g, ' ') : 'Unspecified Formulation';
  const clean_variant = rawVariant ? rawVariant.trim().replace(/\s+/g, ' ') : 'Standard';

  // Normalize formulation name while removing packaging terms that leaked into title
  const strippedName = clean_product_name
    .replace(/\b\d+(\.\d+)?\s*(g|grams|ml|milliliters|kg|l)\b/gi, '')
    .replace(/\b(twin\s*pack|single|bundle|pack\s*of\s*\d+)\b/gi, '')
    .trim();

  const prodSlug = normalizeIdentityString(strippedName || clean_product_name);
  const variantSlug = normalizeIdentityString(clean_variant);

  const product_id = `prod-${brandId}-${prodSlug}-${variantSlug}`.replace(/--+/g, '-');
  return { product_id, clean_product_name, clean_variant };
}

/**
 * Resolves canonical SKU identity following the strict 3-tier hierarchy
 */
export function resolveSKUIdentity(input: IdentityResolutionInput): ResolvedSKUIdentity {
  const { brand_id, brand_name } = resolveBrandIdentity(input.brand);
  const { product_id, clean_product_name, clean_variant } = resolveProductIdentity(
    brand_id,
    input.product_name,
    input.variant || ''
  );

  const packCount = input.multipack_units && input.multipack_units > 1 ? input.multipack_units : 1;
  const netContent = Number(input.net_content) || 0;
  const unit = (input.unit_of_measure || 'g').toLowerCase() as UnitOfMeasure;

  // Tier 1: Authoritative GTIN / Barcode (EAN-13, UPC-A, GTIN-14)
  if (input.barcode_ean && /^\d{8,14}$/.test(input.barcode_ean.trim())) {
    const cleanBarcode = input.barcode_ean.trim();
    return {
      canonical_sku_id: `sku-gtin-${cleanBarcode}`,
      canonical_product_id: product_id,
      canonical_brand_id: brand_id,
      resolution_method: 'barcode_gtin',
      confidence: 'high',
      barcode_ean: cleanBarcode,
      normalized_brand: brand_name,
      normalized_product_name: clean_product_name,
      normalized_variant: clean_variant,
      is_ambiguous: false
    };
  }

  // Tier 2: Explicit Authoritative SKU ID (e.g. from structured manufacturer feed)
  if (input.sku_id && input.sku_id.trim().length > 3 && !input.sku_id.includes(' ')) {
    const cleanSkuId = input.sku_id.trim();
    return {
      canonical_sku_id: `sku-id-${normalizeIdentityString(cleanSkuId)}`,
      canonical_product_id: product_id,
      canonical_brand_id: brand_id,
      resolution_method: 'explicit_id',
      confidence: 'high',
      normalized_brand: brand_name,
      normalized_product_name: clean_product_name,
      normalized_variant: clean_variant,
      is_ambiguous: false
    };
  }

  // Tier 3: Deterministic Normalized Composite Fallback
  // Checks for identity completeness
  const isAmbiguous = !input.brand || !input.product_name || netContent <= 0;
  let ambiguityReason: string | undefined = undefined;

  if (!input.brand) ambiguityReason = 'Missing brand identification';
  else if (!input.product_name) ambiguityReason = 'Missing product formulation title';
  else if (netContent <= 0) ambiguityReason = 'Unspecified or zero package size quantity';

  const brandSlug = brand_id;
  const prodSlug = normalizeIdentityString(clean_product_name);
  const varSlug = normalizeIdentityString(clean_variant);
  const packSuffix = packCount > 1 ? `-${packCount}pk` : '';
  const compositeId = `sku-${brandSlug}-${prodSlug}-${varSlug}-${netContent}${unit}${packSuffix}`
    .replace(/--+/g, '-');

  return {
    canonical_sku_id: compositeId,
    canonical_product_id: product_id,
    canonical_brand_id: brand_id,
    resolution_method: 'composite_deterministic',
    confidence: isAmbiguous ? 'provisional' : 'high',
    normalized_brand: brand_name,
    normalized_product_name: clean_product_name,
    normalized_variant: clean_variant,
    is_ambiguous: isAmbiguous,
    ambiguity_reason: ambiguityReason
  };
}
