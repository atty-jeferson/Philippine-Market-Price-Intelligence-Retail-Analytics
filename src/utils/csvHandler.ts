import { ProductData, ToothpasteProduct, NormalizedProduct, DataQualityReport, SizeUnit, PositioningTier, OriginType, RetailerType } from '../types';
import { ingestDatasetFromCSV, IngestionPipelineResult, auditInMemoryProducts } from '../domain';

export interface ProcessImportedCSVResult {
  products: ProductData[];
  report: DataQualityReport;
  pipelineResult?: IngestionPipelineResult;
}

/**
 * Parses CSV text into raw line rows handling quoted cells
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Validates and converts parsed CSV rows into ProductData array via the Ingestion Pipeline
 */
export function processImportedCSV(csvText: string): ProcessImportedCSVResult {
  const pipelineResult = ingestDatasetFromCSV(csvText);
  const summary = pipelineResult.validationSummary;

  const legacyIssues = summary.issues.map(
    (i) => `Row ${i.rowNumber}: [${i.severity}] ${i.message}`
  );

  const report: DataQualityReport = {
    totalRows: summary.totalRows,
    validRows: summary.validRows,
    excludedRows: summary.rejectedRows,
    duplicatesRemoved: summary.duplicateCount,
    qualityScorePercent: summary.qualityScorePercent,
    issuesFound: legacyIssues.slice(0, 20),
    missingSizeCount: summary.missingFieldsBreakdown['net_content'] || 0,
    missingPriceCount: summary.missingFieldsBreakdown['shelf_price'] || 0,
    suspiciousPriceCount: summary.issues.filter((i) => i.code === 'EXTREME_PRICE_OUTLIER').length
  };

  return {
    products: pipelineResult.legacyProducts,
    report,
    pipelineResult
  };
}


/**
 * Convenience parser for CSV text to ToothpasteProduct array
 */
export function parseCSVToProducts(csvText: string): ToothpasteProduct[] {
  const result = processImportedCSV(csvText);
  return result.products;
}

/**
 * Generates an audit report on an active list of normalized products
 */
export function generateDataQualityReport(products: NormalizedProduct[]): DataQualityReport {
  const totalRows = products.length;
  let missingPrices = 0;
  let missingSizes = 0;
  let outlierCount = 0;
  let duplicates = 0;
  const issues: string[] = [];

  const seenSKUs = new Set<string>();

  products.forEach((p, idx) => {
    if (!p.price_php || p.price_php <= 0) {
      missingPrices++;
      issues.push(`Product #${idx + 1} (${p.product_name}) has zero or invalid shelf price.`);
    }
    if (!p.total_weight_grams || p.total_weight_grams <= 0) {
      missingSizes++;
      issues.push(`Product #${idx + 1} (${p.product_name}) has invalid package weight.`);
    }
    if (p.price_per_100g < 15 || p.price_per_100g > 800) {
      outlierCount++;
      issues.push(`Product #${idx + 1} (${p.brand} ${p.variant}) is a statistical unit price outlier (₱${p.price_per_100g.toFixed(2)}/100g).`);
    }

    const key = `${p.brand.toLowerCase()}-${p.variant.toLowerCase()}-${p.retailer.toLowerCase()}-${p.total_weight_grams}`;
    if (seenSKUs.has(key)) {
      duplicates++;
    } else {
      seenSKUs.add(key);
    }
  });

  const validRows = totalRows - missingPrices - missingSizes;
  const qualityScorePercent = totalRows > 0
    ? Math.max(0, Math.min(100, Math.round(((validRows - outlierCount * 0.5) / (totalRows || 1)) * 100)))
    : 100;

  return {
    totalRows,
    validRows,
    excludedRows: missingPrices + missingSizes,
    duplicatesRemoved: duplicates,
    qualityScorePercent,
    issuesFound: issues,
    missingSizeCount: missingSizes,
    missingPriceCount: missingPrices,
    suspiciousPriceCount: outlierCount
  };
}

function determineRetailerType(retailer: string): RetailerType {
  const r = retailer.toLowerCase();
  if (r.includes('watsons') || r.includes('mercury') || r.includes('pharmacy') || r.includes('drug')) {
    return 'Pharmacy / Health';
  }
  if (r.includes('shopee') || r.includes('lazada') || r.includes('tiktok') || r.includes('online')) {
    return 'E-Commerce Marketplace';
  }
  return 'Supermarket / Hypermarket';
}

/**
 * Exports products to CSV format
 */
export function exportProductsToCSV(products: NormalizedProduct[]): string {
  const headers = [
    'product_id',
    'brand',
    'product_name',
    'variant',
    'size_value',
    'size_unit',
    'total_weight_grams',
    'price_php',
    'price_per_100g',
    'price_index',
    'value_score',
    'discount_percent',
    'retailer',
    'retailer_type',
    'rating',
    'date_collected',
    'whitening',
    'sensitivity',
    'anti_cavity',
    'gum_care',
    'source'
  ];

  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = products.map((p) => [
    p.product_id,
    p.brand,
    p.product_name,
    p.variant,
    p.size_value,
    p.size_unit,
    p.total_weight_grams,
    p.price_php.toFixed(2),
    p.price_per_100g.toFixed(2),
    p.price_index,
    p.value_score,
    p.discount_percent.toFixed(1),
    p.retailer,
    p.retailer_type,
    p.rating.toFixed(1),
    p.date_collected,
    p.whitening ? '1' : '0',
    p.sensitivity ? '1' : '0',
    p.anti_cavity ? '1' : '0',
    p.gum_care ? '1' : '0',
    p.source
  ]);

  return [headers.join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
}

/**
 * Triggers browser download of text/csv content
 */
export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
