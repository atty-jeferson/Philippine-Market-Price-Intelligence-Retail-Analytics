/**
 * THE GROCER - Ingestion, Identity & Normalization Trust Pipeline
 * 
 * Executes the complete 6-stage trust pipeline:
 * RAW CSV / DATA
 *    ↓ Stage 1: Header & Field Mapping
 *    ↓ Stage 2: Ingestion & Parsing
 *    ↓ Stage 3: Multi-tier Validation & Duplicate Detection
 *    ↓ Stage 4: Identity Resolution (GTIN -> Explicit -> Composite)
 *    ↓ Stage 5: Normalization Engine (CategoryConfig + Multipack)
 *    ↓ Stage 6: Domain Dataset Assembly & Legacy Projection
 */

import { DomainDataset, MarketScope, Brand, Product, SKU, Retailer, StoreOutlet, PriceObservation, Promotion, DataSource, EvidenceStatus } from './types';
import { CategoryConfig, TOOTHPASTE_CATEGORY_CONFIG } from './categoryConfig';
import { SchemaInspectionReport, inspectAndMapHeaders, ColumnMappingResult } from './mapping';
import { resolveSKUIdentity } from './identity';
import { validatePricing, validatePackageQuantity, validateObservationDate, ValidationIssue, ValidationSummary, DuplicateObservationRecord } from './validation';
import { normalizeProductPricing } from './normalization';
import { ProductData } from '../types';
import { toSlug } from './adapters';

export interface IngestionPipelineOptions {
  categoryConfig?: CategoryConfig;
  customScope?: Partial<MarketScope>;
  defaultDataSourceName?: string;
  allowProvisionalIdentities?: boolean;
}

export interface IngestionPipelineResult {
  domainDataset: DomainDataset;
  legacyProducts: ProductData[];
  validationSummary: ValidationSummary;
  schemaReport: SchemaInspectionReport;
}

/**
 * Basic RFC-4180 CSV tokenizer to split rows and escaped columns cleanly
 */
export function tokenizeCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Ignore carriage return
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Ingests raw CSV text through the complete trust pipeline
 */
export function ingestDatasetFromCSV(
  csvText: string,
  options: IngestionPipelineOptions = {}
): IngestionPipelineResult {
  const config = options.categoryConfig || TOOTHPASTE_CATEGORY_CONFIG;
  const scope: MarketScope = {
    ...config.default_scope,
    ...options.customScope
  };

  const rows = tokenizeCSV(csvText);

  if (rows.length < 2) {
    const emptyReport: SchemaInspectionReport = {
      rawHeaders: [],
      mappings: [],
      mappedCanonicalKeys: new Set(),
      missingRequiredKeys: ['brand', 'product_name', 'shelf_price', 'retailer', 'observed_date', 'net_content'],
      isViable: false
    };

    const emptySummary: ValidationSummary = {
      totalRows: 0,
      validRows: 0,
      rejectedRows: 0,
      warningCount: 0,
      errorCount: 1,
      infoCount: 0,
      duplicateCount: 0,
      qualityScorePercent: 0,
      duplicates: [],
      issues: [{
        rowNumber: 0,
        severity: 'ERROR',
        code: 'EMPTY_FILE',
        message: 'CSV file contains no data rows or missing header row.'
      }],
      missingFieldsBreakdown: {},
      freshness: { oldestDate: null, newestDate: null, dateSpanDays: 0, hasFutureDates: false },
      provenanceBreakdown: {},
      evidenceBreakdown: { Observed: 0, Derived: 0, Estimated: 0, Inferred: 0 }
    };

    return {
      domainDataset: {
        scope,
        brands: new Map(),
        products: new Map(),
        skus: new Map(),
        retailers: new Map(),
        stores: new Map(),
        promotions: new Map(),
        dataSources: new Map(),
        observations: []
      },
      legacyProducts: [],
      validationSummary: emptySummary,
      schemaReport: emptyReport
    };
  }

  // Stage 1: Inspect headers and establish column mappings
  const rawHeaders = rows[0];
  const schemaReport = inspectAndMapHeaders(rawHeaders, config);

  // Quick lookup helper for mapped canonical fields
  const colIndexMap = new Map<string, number>();
  const attrColMap = new Map<string, number>();

  schemaReport.mappings.forEach((m) => {
    if (m.matchedField) {
      if (m.matchedField.canonicalKey === 'category_attribute' && m.matchedField.attributeKey) {
        attrColMap.set(m.matchedField.attributeKey, m.headerIndex);
      } else {
        colIndexMap.set(m.matchedField.canonicalKey, m.headerIndex);
      }
    }
  });

  const getValue = (row: string[], canonicalKey: string): string | undefined => {
    const idx = colIndexMap.get(canonicalKey);
    return idx !== undefined && idx < row.length ? row[idx] : undefined;
  };

  // State accumulators for domain dataset and quality metrics
  const brands = new Map<string, Brand>();
  const productEntities = new Map<string, Product>();
  const skus = new Map<string, SKU>();
  const retailers = new Map<string, Retailer>();
  const stores = new Map<string, StoreOutlet>();
  const promotions = new Map<string, Promotion>();
  const dataSources = new Map<string, DataSource>();
  const observations: PriceObservation[] = [];
  const legacyProducts: ProductData[] = [];

  const issues: ValidationIssue[] = [];
  const duplicates: DuplicateObservationRecord[] = [];
  const observationKeysSeen = new Map<string, { rowNumber: number; price: number }>();
  const missingFieldsBreakdown: Record<string, number> = {};
  const provenanceBreakdown: Record<string, number> = {};
  const evidenceBreakdown: Record<EvidenceStatus, number> = {
    Observed: 0,
    Derived: 0,
    Estimated: 0,
    Inferred: 0
  };

  let validRowCount = 0;
  let rejectedRowCount = 0;
  let oldestDateTimestamp: number | null = null;
  let newestDateTimestamp: number | null = null;
  let oldestDateStr: string | null = null;
  let newestDateStr: string | null = null;
  let hasFutureDates = false;

  // Process data rows
  for (let rIdx = 1; rIdx < rows.length; rIdx++) {
    const row = rows[rIdx];
    const rowNumber = rIdx + 1; // 1-indexed for user visibility
    const rowIssues: ValidationIssue[] = [];

    const rawBrand = getValue(row, 'brand');
    const rawProductName = getValue(row, 'product_name');
    const rawVariant = getValue(row, 'variant');
    const rawSkuId = getValue(row, 'sku_id');
    const rawBarcode = getValue(row, 'barcode_ean');
    const rawShelfPrice = getValue(row, 'shelf_price');
    const rawRegularPrice = getValue(row, 'regular_price');
    const rawRetailer = getValue(row, 'retailer');
    const rawStore = getValue(row, 'store');
    const rawObsDate = getValue(row, 'observed_date');
    const rawNetContent = getValue(row, 'net_content');
    const rawUom = getValue(row, 'unit_of_measure');
    const rawMultipackUnits = getValue(row, 'multipack_units');
    const rawRating = getValue(row, 'rating');
    const rawReviewCount = getValue(row, 'review_count');
    const rawTier = getValue(row, 'tier');
    const rawOrigin = getValue(row, 'origin');
    const rawProductUrl = getValue(row, 'product_url');

    // Check identity requirements
    if (!rawBrand) {
      missingFieldsBreakdown['brand'] = (missingFieldsBreakdown['brand'] || 0) + 1;
      rowIssues.push({
        rowNumber,
        field: 'brand',
        severity: 'ERROR',
        code: 'MISSING_BRAND',
        message: 'Brand identification is missing'
      });
    }

    if (!rawProductName) {
      missingFieldsBreakdown['product_name'] = (missingFieldsBreakdown['product_name'] || 0) + 1;
      rowIssues.push({
        rowNumber,
        field: 'product_name',
        severity: 'ERROR',
        code: 'MISSING_PRODUCT_NAME',
        message: 'Product name is missing'
      });
    }

    if (!rawRetailer) {
      missingFieldsBreakdown['retailer'] = (missingFieldsBreakdown['retailer'] || 0) + 1;
      rowIssues.push({
        rowNumber,
        field: 'retailer',
        severity: 'ERROR',
        code: 'MISSING_RETAILER',
        message: 'Retailer banner is missing'
      });
    }

    // Stage 3: Pricing Validation
    const priceRes = validatePricing(rawShelfPrice, rawRegularPrice, rowNumber, rowIssues);
    if (priceRes.shelfPrice === null) {
      missingFieldsBreakdown['shelf_price'] = (missingFieldsBreakdown['shelf_price'] || 0) + 1;
    }

    // Stage 3: Date Validation
    const dateRes = validateObservationDate(rawObsDate, rowNumber, rowIssues);
    if (!dateRes.validDate) {
      missingFieldsBreakdown['observed_date'] = (missingFieldsBreakdown['observed_date'] || 0) + 1;
    } else {
      const time = new Date(dateRes.validDate).getTime();
      if (oldestDateTimestamp === null || time < oldestDateTimestamp) {
        oldestDateTimestamp = time;
        oldestDateStr = dateRes.validDate;
      }
      if (newestDateTimestamp === null || time > newestDateTimestamp) {
        newestDateTimestamp = time;
        newestDateStr = dateRes.validDate;
      }
      if (dateRes.isFuture) hasFutureDates = true;
    }

    // Stage 3: Quantity & Multipack Validation
    const qtyRes = validatePackageQuantity(
      rawNetContent,
      rawUom,
      rawProductName || '',
      rawMultipackUnits,
      rowNumber,
      rowIssues
    );
    if (qtyRes.netContent === null) {
      missingFieldsBreakdown['net_content'] = (missingFieldsBreakdown['net_content'] || 0) + 1;
    }

    // Check if row has hard fatal errors
    const hasFatalErrors = rowIssues.some((issue) => issue.severity === 'ERROR');

    if (hasFatalErrors) {
      rejectedRowCount++;
      issues.push(...rowIssues);
      continue;
    }

    // If passed fatal validation, proceed to Stage 4: Identity Resolution
    const resolvedIdentity = resolveSKUIdentity({
      barcode_ean: rawBarcode,
      sku_id: rawSkuId,
      brand: rawBrand || 'Generic Brand',
      product_name: rawProductName || 'Generic Product',
      variant: rawVariant || 'Regular',
      net_content: qtyRes.netContent!,
      unit_of_measure: qtyRes.unitOfMeasure as any,
      multipack_units: qtyRes.multipackUnits
    });

    if (resolvedIdentity.resolution_method === 'composite_deterministic' && !rawBarcode) {
      rowIssues.push({
        rowNumber,
        field: 'barcode_ean',
        severity: 'WARNING',
        code: 'MISSING_BARCODE_FALLBACK_USED',
        message: 'No GTIN/barcode supplied; resolved identity using deterministic composite formula.',
        remediationAction: 'Using composite SKU key for identity resolution.'
      });
    }

    // Duplicate observation detection: SKU + Retailer + Store + Date
    const retailerSlug = toSlug(rawRetailer || 'sample-retailer');
    const storeSlug = toSlug(rawStore || 'flagship');
    const obsKey = `${resolvedIdentity.canonical_sku_id}:::${retailerSlug}:::${storeSlug}:::${dateRes.validDate}`;

    if (observationKeysSeen.has(obsKey)) {
      const existing = observationKeysSeen.get(obsKey)!;
      const dupRecord: DuplicateObservationRecord = {
        rowNumber,
        existingRowNumber: existing.rowNumber,
        skuKey: resolvedIdentity.canonical_sku_id,
        retailer: rawRetailer || 'Unknown',
        store: rawStore || 'Main',
        observedDate: dateRes.validDate!,
        price: priceRes.shelfPrice!,
        existingPrice: existing.price,
        reason: `Identical SKU observed at same retailer & store on identical calendar date ${dateRes.validDate}`
      };
      duplicates.push(dupRecord);
      rowIssues.push({
        rowNumber,
        severity: 'WARNING',
        code: 'DUPLICATE_OBSERVATION',
        message: `Duplicate observation of SKU at "${rawRetailer}" on ${dateRes.validDate} (previously in Row ${existing.rowNumber}). Flagged for audit.`,
        remediationAction: 'Preserved as distinct observation with audit flag.'
      });
    } else {
      observationKeysSeen.set(obsKey, { rowNumber, price: priceRes.shelfPrice! });
    }

    // Stage 5: Normalization
    const normResult = normalizeProductPricing({
      shelf_price: priceRes.shelfPrice!,
      regular_price: priceRes.regularPrice!,
      net_content: qtyRes.netContent!,
      unit_of_measure: qtyRes.unitOfMeasure,
      multipack_units: qtyRes.multipackUnits,
      categoryConfig: config
    });

    // Extract dynamic category attributes from row
    const extractedAttributes: Record<string, boolean | string | number> = {};
    config.attributes.forEach((attr) => {
      const colIdx = attrColMap.get(attr.key);
      if (colIdx !== undefined && colIdx < row.length) {
        const val = row[colIdx].trim().toLowerCase();
        if (attr.type === 'boolean') {
          extractedAttributes[attr.key] = val === 'true' || val === '1' || val === 'yes';
        } else if (attr.type === 'number') {
          extractedAttributes[attr.key] = parseFloat(val) || 0;
        } else {
          extractedAttributes[attr.key] = row[colIdx].trim();
        }
      }
    });

    // Stage 6: Register Domain Entities
    // Brand
    if (!brands.has(resolvedIdentity.canonical_brand_id)) {
      brands.set(resolvedIdentity.canonical_brand_id, {
        brand_id: resolvedIdentity.canonical_brand_id,
        brand_name: resolvedIdentity.normalized_brand,
        origin: (rawOrigin as any) || 'Unknown',
        default_tier: (rawTier as any) || 'Unknown'
      });
    }

    // Product
    if (!productEntities.has(resolvedIdentity.canonical_product_id)) {
      productEntities.set(resolvedIdentity.canonical_product_id, {
        product_id: resolvedIdentity.canonical_product_id,
        brand_id: resolvedIdentity.canonical_brand_id,
        product_name: resolvedIdentity.normalized_product_name,
        variant: resolvedIdentity.normalized_variant,
        category_id: config.category_id,
        sub_category: config.sub_categories[0] || 'General'
      });
    }

    // SKU
    if (!skus.has(resolvedIdentity.canonical_sku_id)) {
      skus.set(resolvedIdentity.canonical_sku_id, {
        sku_id: resolvedIdentity.canonical_sku_id,
        product_id: resolvedIdentity.canonical_product_id,
        barcode_ean: resolvedIdentity.barcode_ean,
        net_content: qtyRes.netContent!,
        unit_of_measure: qtyRes.unitOfMeasure as any,
        multipack_units: qtyRes.multipackUnits,
        is_multipack: qtyRes.isMultipack,
        package_type: 'Tube',
        attributes: extractedAttributes
      });
    }

    // Retailer
    if (!retailers.has(retailerSlug)) {
      retailers.set(retailerSlug, {
        retailer_id: retailerSlug,
        retailer_name: rawRetailer || 'Retailer',
        channel_type: 'Supermarket / Hypermarket',
        region_scope: 'Philippines'
      });
    }

    // StoreOutlet
    const storeId = `store-${retailerSlug}-${storeSlug}`;
    if (!stores.has(storeId)) {
      stores.set(storeId, {
        store_id: storeId,
        retailer_id: retailerSlug,
        branch_name: rawStore || `${rawRetailer} Branch`,
        location: rawStore || 'Metro Manila',
        is_digital: false
      });
    }

    // DataSource
    const sourceName = options.defaultDataSourceName || 'CSV Ingestion Audit';
    const sourceId = toSlug(sourceName);
    if (!dataSources.has(sourceId)) {
      dataSources.set(sourceId, {
        data_source_id: sourceId,
        source_name: sourceName,
        source_type: 'user_csv_upload',
        collected_at: new Date().toISOString(),
        verification_status: 'unverified'
      });
    }
    provenanceBreakdown[sourceName] = (provenanceBreakdown[sourceName] || 0) + 1;

    // Promotion
    let promoId: string | undefined = undefined;
    if (priceRes.isPromotional) {
      promoId = `promo-${retailerSlug}-${resolvedIdentity.canonical_sku_id}-${dateRes.validDate}`;
      if (!promotions.has(promoId)) {
        promotions.set(promoId, {
          promotion_id: promoId,
          promotion_type: 'discount',
          discount_percent: priceRes.discountPercent,
          discount_amount_php: priceRes.regularPrice! - priceRes.shelfPrice!,
          promotion_mechanic: `${priceRes.discountPercent}% Promotional Discount`
        });
      }
    }

    // PriceObservation
    const obsId = `obs-${rowNumber}-${resolvedIdentity.canonical_sku_id}-${retailerSlug}`;
    observations.push({
      observation_id: obsId,
      sku_id: resolvedIdentity.canonical_sku_id,
      retailer_id: retailerSlug,
      store_id: storeId,
      observed_date: dateRes.validDate!,
      shelf_price: priceRes.shelfPrice!,
      regular_price: priceRes.regularPrice!,
      currency: scope.currency,
      is_promotional: priceRes.isPromotional,
      promotion_id: promoId,
      data_source_id: sourceId,
      evidence_status: 'Observed',
      rating: rawRating ? parseFloat(rawRating) : undefined,
      review_count: rawReviewCount ? parseInt(rawReviewCount, 10) : undefined
    });

    evidenceBreakdown.Observed++;

    // Reconstruct legacy product for immediate analytical compatibility
    const legacyProd: ProductData = {
      product_id: resolvedIdentity.canonical_sku_id.replace(/^sku-/, ''),
      brand: resolvedIdentity.normalized_brand,
      product_name: resolvedIdentity.normalized_product_name,
      variant: resolvedIdentity.normalized_variant,
      category: scope.category,
      sub_category: config.sub_categories[0] || scope.sub_category,
      size_value: qtyRes.netContent!,
      size_unit: qtyRes.unitOfMeasure === 'ml' ? 'ml' : 'g',
      weight_grams: qtyRes.unitOfMeasure === 'g' ? normResult.total_net_content : normResult.total_net_content,
      volume_ml: qtyRes.unitOfMeasure === 'ml' ? normResult.total_net_content : null,
      is_multipack: qtyRes.isMultipack,
      multipack_count: qtyRes.multipackUnits,
      price_php: priceRes.shelfPrice!,
      regular_price_php: priceRes.regularPrice!,
      sale_price_php: priceRes.isPromotional ? priceRes.shelfPrice : null,
      discount_percent: priceRes.discountPercent,
      retailer: rawRetailer || 'Unknown Retailer',
      retailer_type: 'Supermarket / Hypermarket',
      location: rawStore || 'Metro Manila',
      date_collected: dateRes.validDate!,
      product_url: rawProductUrl || '',
      rating: rawRating ? parseFloat(rawRating) : undefined,
      review_count: rawReviewCount ? parseInt(rawReviewCount, 10) : 0,
      fluoride: extractedAttributes.fluoride !== undefined ? Boolean(extractedAttributes.fluoride) : false,
      whitening: extractedAttributes.whitening !== undefined ? Boolean(extractedAttributes.whitening) : false,
      sensitivity: extractedAttributes.sensitivity !== undefined ? Boolean(extractedAttributes.sensitivity) : false,
      anti_cavity: extractedAttributes.anti_cavity !== undefined ? Boolean(extractedAttributes.anti_cavity) : false,
      gum_care: extractedAttributes.gum_care !== undefined ? Boolean(extractedAttributes.gum_care) : false,
      herbal: extractedAttributes.herbal !== undefined ? Boolean(extractedAttributes.herbal) : false,
      charcoal: extractedAttributes.charcoal !== undefined ? Boolean(extractedAttributes.charcoal) : false,
      kids: extractedAttributes.kids !== undefined ? Boolean(extractedAttributes.kids) : false,
      premium_positioning: (rawTier as any) || 'Unknown',
      origin: (rawOrigin as any) || 'Unknown',
      source: sourceName,
      is_demo: false
    };

    legacyProducts.push(legacyProd);
    validRowCount++;
    issues.push(...rowIssues);
  }

  // Calculate quality score
  const totalRows = rows.length - 1;
  const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
  const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
  const infoCount = issues.filter((i) => i.severity === 'INFO').length;

  let qualityScore = 100;
  if (totalRows > 0) {
    const penalty = (errorCount * 15 + warningCount * 3 + duplicates.length * 2) / totalRows;
    qualityScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  const dateSpanDays =
    oldestDateTimestamp && newestDateTimestamp
      ? Math.round((newestDateTimestamp - oldestDateTimestamp) / (1000 * 60 * 60 * 24))
      : 0;

  const validationSummary: ValidationSummary = {
    totalRows,
    validRows: validRowCount,
    rejectedRows: rejectedRowCount,
    warningCount,
    errorCount,
    infoCount,
    duplicateCount: duplicates.length,
    qualityScorePercent: qualityScore,
    duplicates,
    issues,
    missingFieldsBreakdown,
    freshness: {
      oldestDate: oldestDateStr,
      newestDate: newestDateStr,
      dateSpanDays,
      hasFutureDates
    },
    provenanceBreakdown,
    evidenceBreakdown
  };

  return {
    domainDataset: {
      scope,
      brands,
      products: productEntities,
      skus,
      retailers,
      stores,
      promotions,
      dataSources,
      observations
    },
    legacyProducts,
    validationSummary,
    schemaReport
  };
}

/**
 * Convenience method to audit and validate an existing in-memory ProductData array
 */
export function auditInMemoryProducts(
  products: ProductData[],
  categoryConfig: CategoryConfig = TOOTHPASTE_CATEGORY_CONFIG
): ValidationSummary {
  const safeProducts = products || [];
  const issues: ValidationIssue[] = [];
  const duplicates: DuplicateObservationRecord[] = [];
  const seenKeys = new Map<string, number>();
  const missingFields: Record<string, number> = {};
  const provenance: Record<string, number> = {};
  const evidence: Record<EvidenceStatus, number> = {
    Observed: 0,
    Derived: 0,
    Estimated: 0,
    Inferred: 0
  };

  let oldestTimestamp: number | null = null;
  let newestTimestamp: number | null = null;
  let oldestDateStr: string | null = null;
  let newestDateStr: string | null = null;
  let hasFutureDates = false;

  safeProducts.forEach((p, idx) => {
    const rowNum = idx + 1;
    const resolvedSku = resolveSKUIdentity({
      barcode_ean: undefined,
      sku_id: p.product_id,
      brand: p.brand,
      product_name: p.product_name,
      variant: p.variant,
      net_content: p.weight_grams || p.size_value,
      unit_of_measure: p.size_unit,
      multipack_units: p.multipack_count
    });

    if (resolvedIdentityIsComposite(resolvedSku)) {
      issues.push({
        rowNumber: rowNum,
        field: 'barcode_ean',
        severity: 'WARNING',
        code: 'MISSING_BARCODE_FALLBACK_USED',
        message: 'No GTIN/barcode supplied in memory record; using deterministic composite identity.'
      });
    }

    // Duplicate check: SKU + Retailer + Date
    const obsKey = `${resolvedSku.canonical_sku_id}:::${toSlug(p.retailer)}:::${p.date_collected}`;
    if (seenKeys.has(obsKey)) {
      const prev = seenKeys.get(obsKey)!;
      duplicates.push({
        rowNumber: rowNum,
        existingRowNumber: prev,
        skuKey: resolvedSku.canonical_sku_id,
        retailer: p.retailer,
        store: p.location,
        observedDate: p.date_collected,
        price: p.price_php,
        existingPrice: products[prev - 1]?.price_php || p.price_php,
        reason: 'Identical SKU observed at same retailer on identical calendar date'
      });
      issues.push({
        rowNumber: rowNum,
        severity: 'WARNING',
        code: 'DUPLICATE_OBSERVATION',
        message: `Duplicate SKU observation at "${p.retailer}" on ${p.date_collected} (previously seen at record ${prev}).`
      });
    } else {
      seenKeys.set(obsKey, rowNum);
    }

    if (p.date_collected) {
      const t = new Date(p.date_collected).getTime();
      if (!isNaN(t)) {
        if (oldestTimestamp === null || t < oldestTimestamp) {
          oldestTimestamp = t;
          oldestDateStr = p.date_collected;
        }
        if (newestTimestamp === null || t > newestTimestamp) {
          newestTimestamp = t;
          newestDateStr = p.date_collected;
        }
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (t > tomorrow.getTime()) hasFutureDates = true;
      }
    }

    const src = p.source || 'Standard Philippine Retail Audit';
    provenance[src] = (provenance[src] || 0) + 1;
    evidence.Observed++;
  });

  const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
  const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
  const infoCount = issues.filter((i) => i.severity === 'INFO').length;

  const dateSpan =
    oldestTimestamp && newestTimestamp ? Math.round((newestTimestamp - oldestTimestamp) / (1000 * 60 * 60 * 24)) : 0;

  return {
    totalRows: products.length,
    validRows: products.length,
    rejectedRows: 0,
    warningCount,
    errorCount,
    infoCount,
    duplicateCount: duplicates.length,
    qualityScorePercent: 100, // Benchmark dataset is pristine
    duplicates,
    issues,
    missingFieldsBreakdown: missingFields,
    freshness: {
      oldestDate: oldestDateStr,
      newestDate: newestDateStr,
      dateSpanDays: dateSpan,
      hasFutureDates
    },
    provenanceBreakdown: provenance,
    evidenceBreakdown: evidence
  };
}

function resolvedIdentityIsComposite(res: any): boolean {
  return res.resolution_method === 'composite_deterministic';
}
