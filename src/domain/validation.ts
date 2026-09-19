/**
 * THE GROCER - Ingestion Validation & Quality Engine
 * 
 * Provides rigorous, multi-tiered validation with explicit severity classifications:
 * - ERROR: Hard integrity failures that prevent observation ingestion (e.g. missing price, non-positive quantity, corrupt date)
 * - WARNING: Data quality degradations that allow ingestion with remediation (e.g. missing GTIN barcode, duplicate observation, extreme price outlier)
 * - INFO: Observational metadata notices (e.g. fallback attribute inference, default provenance assignment)
 */

import { EvidenceStatus } from './types';

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssue {
  rowNumber: number;
  field?: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  originalValue?: unknown;
  remediationAction?: string;
}

export interface DuplicateObservationRecord {
  rowNumber: number;
  existingRowNumber: number;
  skuKey: string;
  retailer: string;
  store: string;
  observedDate: string;
  price: number;
  existingPrice: number;
  reason: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  warningCount: number;
  errorCount: number;
  infoCount: number;
  duplicateCount: number;
  qualityScorePercent: number;
  duplicates: DuplicateObservationRecord[];
  issues: ValidationIssue[];
  missingFieldsBreakdown: Record<string, number>;
  freshness: {
    oldestDate: string | null;
    newestDate: string | null;
    dateSpanDays: number;
    hasFutureDates: boolean;
  };
  provenanceBreakdown: Record<string, number>;
  evidenceBreakdown: Record<EvidenceStatus, number>;
}

export interface ParsedRawRow {
  rowNumber: number;
  brand?: string;
  product_name?: string;
  variant?: string;
  sku_id?: string;
  barcode_ean?: string;
  shelf_price_raw?: string | number;
  regular_price_raw?: string | number;
  sale_price_raw?: string | number;
  retailer?: string;
  store?: string;
  observed_date_raw?: string;
  net_content_raw?: string | number;
  unit_of_measure_raw?: string;
  multipack_units_raw?: string | number;
  is_multipack_raw?: string | boolean;
  rating_raw?: string | number;
  review_count_raw?: string | number;
  tier?: string;
  origin?: string;
  data_source?: string;
  category_attributes?: Record<string, any>;
}

/**
 * Validates whether a date string is a legitimate calendar date in standard ISO / recognizable format
 * and checks for future dates.
 */
export function validateObservationDate(
  dateStr: string | undefined,
  rowNumber: number,
  issues: ValidationIssue[]
): { validDate: string | null; isFuture: boolean } {
  if (!dateStr || !dateStr.trim()) {
    issues.push({
      rowNumber,
      field: 'observed_date',
      severity: 'ERROR',
      code: 'MISSING_DATE',
      message: 'Observation date is missing',
      remediationAction: 'Row rejected; valid observation date is required.'
    });
    return { validDate: null, isFuture: false };
  }

  const trimmed = dateStr.trim();
  const parsed = new Date(trimmed);

  if (isNaN(parsed.getTime())) {
    issues.push({
      rowNumber,
      field: 'observed_date',
      severity: 'ERROR',
      code: 'INVALID_DATE_FORMAT',
      message: `Invalid calendar date format: "${trimmed}"`,
      originalValue: trimmed,
      remediationAction: 'Row rejected; use ISO format YYYY-MM-DD.'
    });
    return { validDate: null, isFuture: false };
  }

  // Check future date (allow up to 24-hour clock drift buffer)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isFuture = parsed.getTime() > tomorrow.getTime();

  if (isFuture) {
    issues.push({
      rowNumber,
      field: 'observed_date',
      severity: 'WARNING',
      code: 'FUTURE_DATE_DETECTED',
      message: `Observation date "${trimmed}" is set in the future`,
      originalValue: trimmed,
      remediationAction: 'Date flagged; observation accepted for forward planning.'
    });
  }

  const isoDate = parsed.toISOString().split('T')[0];
  return { validDate: isoDate, isFuture };
}

/**
 * Validates shelf and regular prices with numeric boundary checks
 */
export function validatePricing(
  shelfPriceRaw: string | number | undefined,
  regularPriceRaw: string | number | undefined,
  rowNumber: number,
  issues: ValidationIssue[]
): { shelfPrice: number | null; regularPrice: number | null; isPromotional: boolean; discountPercent: number } {
  let shelfNum = NaN;

  if (typeof shelfPriceRaw === 'number') {
    shelfNum = shelfPriceRaw;
  } else if (typeof shelfPriceRaw === 'string') {
    shelfNum = parseFloat(shelfPriceRaw.replace(/[^0-9.]/g, ''));
  }

  if (isNaN(shelfNum)) {
    issues.push({
      rowNumber,
      field: 'shelf_price',
      severity: 'ERROR',
      code: 'MISSING_OR_NAN_PRICE',
      message: 'Observed shelf price is missing or non-numeric',
      originalValue: shelfPriceRaw,
      remediationAction: 'Row rejected; valid retail price is mandatory.'
    });
    return { shelfPrice: null, regularPrice: null, isPromotional: false, discountPercent: 0 };
  }

  if (shelfNum <= 0) {
    issues.push({
      rowNumber,
      field: 'shelf_price',
      severity: 'ERROR',
      code: 'NON_POSITIVE_PRICE',
      message: `Observed shelf price must be greater than zero (received ₱${shelfNum})`,
      originalValue: shelfNum,
      remediationAction: 'Row rejected; free or negative items are invalid FMCG retail observations.'
    });
    return { shelfPrice: null, regularPrice: null, isPromotional: false, discountPercent: 0 };
  }

  if (shelfNum > 10000) {
    issues.push({
      rowNumber,
      field: 'shelf_price',
      severity: 'WARNING',
      code: 'EXTREME_PRICE_OUTLIER',
      message: `Shelf price ₱${shelfNum.toLocaleString()} exceeds normal FMCG single-item bounds (> ₱10,000)`,
      originalValue: shelfNum,
      remediationAction: 'Observation accepted with outlier flag for supervisor review.'
    });
  }

  // Regular / Base Price validation
  let regNum = NaN;
  if (typeof regularPriceRaw === 'number') {
    regNum = regularPriceRaw;
  } else if (typeof regularPriceRaw === 'string') {
    regNum = parseFloat(regularPriceRaw.replace(/[^0-9.]/g, ''));
  }

  if (typeof regularPriceRaw !== 'undefined' && regularPriceRaw !== '' && !isNaN(regNum) && regNum <= 0) {
    issues.push({
      rowNumber,
      field: 'regular_price',
      severity: 'ERROR',
      code: 'NON_POSITIVE_REGULAR_PRICE',
      message: `Regular base price must be greater than zero if specified (received ₱${regNum})`,
      originalValue: regNum,
      remediationAction: 'Row rejected; regular retail price must be positive.'
    });
    return { shelfPrice: null, regularPrice: null, isPromotional: false, discountPercent: 0 };
  }

  let finalRegPrice = shelfNum;
  let isPromotional = false;
  let discountPercent = 0;

  if (!isNaN(regNum) && regNum > 0) {
    if (regNum < shelfNum) {
      issues.push({
        rowNumber,
        field: 'regular_price',
        severity: 'WARNING',
        code: 'REGULAR_PRICE_LOWER_THAN_SHELF',
        message: `Regular price ₱${regNum} is lower than shelf price ₱${shelfNum}`,
        originalValue: regNum,
        remediationAction: 'Regular price synchronized to equal shelf price.'
      });
      finalRegPrice = shelfNum;
    } else if (regNum > shelfNum) {
      finalRegPrice = regNum;
      isPromotional = true;
      discountPercent = Math.round(((regNum - shelfNum) / regNum) * 100);

      if (discountPercent > 100) {
        issues.push({
          rowNumber,
          field: 'regular_price',
          severity: 'ERROR',
          code: 'DISCOUNT_EXCEEDS_100',
          message: `Promotional discount of ${discountPercent}% exceeds 100% threshold`,
          originalValue: discountPercent,
          remediationAction: 'Row rejected; discount cannot exceed 100%.'
        });
        return { shelfPrice: null, regularPrice: null, isPromotional: false, discountPercent: 0 };
      } else if (discountPercent > 80) {
        issues.push({
          rowNumber,
          field: 'regular_price',
          severity: 'WARNING',
          code: 'EXTREME_PROMOTION_DEPTH',
          message: `Promotional discount of ${discountPercent}% exceeds 80% threshold`,
          originalValue: discountPercent,
          remediationAction: 'Flagged for promotional verification.'
        });
      }
    }
  }

  return {
    shelfPrice: shelfNum,
    regularPrice: finalRegPrice,
    isPromotional,
    discountPercent
  };
}

/**
 * Validates package content size and multipack accounting
 */
export function validatePackageQuantity(
  netContentRaw: string | number | undefined,
  unitRaw: string | undefined,
  productName: string,
  multipackUnitsRaw: string | number | undefined,
  rowNumber: number,
  issues: ValidationIssue[]
): { netContent: number | null; unitOfMeasure: string; multipackUnits: number; isMultipack: boolean } {
  let contentNum = NaN;
  let uom = (unitRaw || 'g').toLowerCase().trim();
  if (uom.includes('ml')) uom = 'ml';
  else if (uom.includes('kg')) uom = 'kg';
  else if (uom.includes('l')) uom = 'l';
  else uom = 'g';

  if (typeof netContentRaw === 'number') {
    contentNum = netContentRaw;
  } else if (typeof netContentRaw === 'string') {
    contentNum = parseFloat(netContentRaw.replace(/[^0-9.]/g, ''));
  }

  // Attempt regex extraction from product title if missing
  if (isNaN(contentNum) || contentNum <= 0) {
    const match = productName.match(/(\d+(?:\.\d+)?)\s*(g|grams|ml|milliliters|kg|l)\b/i);
    if (match) {
      contentNum = parseFloat(match[1]);
      const matchedUnit = match[2].toLowerCase();
      uom = matchedUnit.startsWith('ml') ? 'ml' : matchedUnit.startsWith('kg') ? 'kg' : matchedUnit === 'l' ? 'l' : 'g';
      issues.push({
        rowNumber,
        field: 'net_content',
        severity: 'INFO',
        code: 'QUANTITY_EXTRACTED_FROM_TITLE',
        message: `Package size was missing in column; successfully extracted ${contentNum}${uom} from product title`,
        originalValue: netContentRaw,
        remediationAction: `Applied ${contentNum}${uom}.`
      });
    } else {
      issues.push({
        rowNumber,
        field: 'net_content',
        severity: 'ERROR',
        code: 'INVALID_NET_CONTENT',
        message: `Net content quantity is missing or zero ("${netContentRaw || ''}")`,
        originalValue: netContentRaw,
        remediationAction: 'Row rejected; unit price normalization requires valid net mass/volume.'
      });
      return { netContent: null, unitOfMeasure: uom, multipackUnits: 1, isMultipack: false };
    }
  }

  // Multipack unit accounting
  let packCount = 1;
  if (typeof multipackUnitsRaw !== 'undefined' && multipackUnitsRaw !== '' && multipackUnitsRaw !== null) {
    const rawNum = typeof multipackUnitsRaw === 'number' ? multipackUnitsRaw : parseFloat(String(multipackUnitsRaw));
    if (!isNaN(rawNum) && rawNum <= 0) {
      issues.push({
        rowNumber,
        field: 'multipack_units',
        severity: 'ERROR',
        code: 'INVALID_MULTIPACK_UNITS',
        message: `Multipack unit count must be at least 1 (received ${rawNum})`,
        originalValue: multipackUnitsRaw,
        remediationAction: 'Row rejected; non-positive multipack count is invalid.'
      });
      return { netContent: null, unitOfMeasure: uom, multipackUnits: 1, isMultipack: false };
    }
  }

  if (typeof multipackUnitsRaw === 'number' && multipackUnitsRaw >= 1) {
    packCount = Math.floor(multipackUnitsRaw);
  } else if (typeof multipackUnitsRaw === 'string') {
    const parsed = parseInt(multipackUnitsRaw.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed >= 1) packCount = parsed;
  }

  // Check title for twin/multipack cues if packCount is 1
  if (packCount === 1) {
    if (/\b(twin\s*pack|2\s*pack|2x|buy\s*1\s*take\s*1)\b/i.test(productName)) {
      packCount = 2;
      issues.push({
        rowNumber,
        field: 'multipack_units',
        severity: 'INFO',
        code: 'MULTIPACK_DETECTED_FROM_TITLE',
        message: 'Detected twin pack from product title; multipack quantity set to 2 units',
        remediationAction: 'Multipack multiplier of 2 applied to total net quantity.'
      });
    } else if (/\b(triple\s*pack|3\s*pack|3x)\b/i.test(productName)) {
      packCount = 3;
      issues.push({
        rowNumber,
        field: 'multipack_units',
        severity: 'INFO',
        code: 'MULTIPACK_DETECTED_FROM_TITLE',
        message: 'Detected triple pack from product title; multipack quantity set to 3 units',
        remediationAction: 'Multipack multiplier of 3 applied to total net quantity.'
      });
    }
  }

  return {
    netContent: contentNum,
    unitOfMeasure: uom,
    multipackUnits: packCount,
    isMultipack: packCount > 1
  };
}
