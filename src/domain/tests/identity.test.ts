/**
 * Deterministic Test Suite: Identity Resolution & Ingestion Pipeline
 * 
 * Verifies:
 * - GTIN priority over composite fallback
 * - Canonical SKU normalization & deduplication
 * - Multipack & package size distinction
 * - DEFAULT_TOOTHPASTES fixture ingestion integrity
 * - No manufactured factual defaults
 */

import { resolveSKUIdentity, resolveBrandIdentity } from '../identity';
import { auditInMemoryProducts } from '../pipeline';
import { productDataToDomain } from '../adapters';
import { TOOTHPASTE_CATEGORY_CONFIG } from '../categoryConfig';
import { SAMPLE_TOOTHPASTES } from '../../data/sampleToothpastes';

export function runIdentityTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${testName}`);
    } else {
      failed++;
      const msg = `  ✗ ${testName}${detail ? `: ${detail}` : ''}`;
      errors.push(msg);
      console.error(msg);
    }
  }

  console.log('\n--- Running Identity Resolution & Pipeline Tests ---');

  // Test 1: GTIN / Barcode Priority
  const gtinIdentity = resolveSKUIdentity({
    barcode_ean: '4800888123456',
    brand: 'Colgate',
    product_name: 'Total Clean Mint',
    variant: 'Clean Mint',
    net_content: 150,
    unit_of_measure: 'g',
    multipack_units: 1
  });
  assert(
    gtinIdentity.resolution_method === 'barcode_gtin',
    'GTIN priority: Uses barcode_gtin when barcode is provided',
    `Expected barcode_gtin, got ${gtinIdentity.resolution_method}`
  );
  assert(
    gtinIdentity.canonical_sku_id === 'sku-gtin-4800888123456',
    'GTIN canonical ID format',
    `Expected sku-gtin-4800888123456, got ${gtinIdentity.canonical_sku_id}`
  );

  // Test 2: Composite Fallback when Barcode is Absent
  const compositeIdentity = resolveSKUIdentity({
    brand: 'Sensodyne',
    product_name: 'Deep Clean Gel',
    variant: 'Deep Clean',
    net_content: 100,
    unit_of_measure: 'g',
    multipack_units: 1
  });
  assert(
    compositeIdentity.resolution_method === 'composite_deterministic',
    'Composite fallback: Uses composite_deterministic when barcode absent',
    `Expected composite_deterministic, got ${compositeIdentity.resolution_method}`
  );
  assert(
    compositeIdentity.canonical_sku_id.includes('sensodyne') && compositeIdentity.canonical_sku_id.includes('100g'),
    'Composite ID includes brand and net content',
    `Got ${compositeIdentity.canonical_sku_id}`
  );

  // Test 3: Multipack vs Single Pack SKU Separation
  const singlePack = resolveSKUIdentity({
    brand: 'Colgate',
    product_name: 'Triple Action',
    variant: 'Original',
    net_content: 150,
    unit_of_measure: 'g',
    multipack_units: 1
  });
  const twinPack = resolveSKUIdentity({
    brand: 'Colgate',
    product_name: 'Triple Action Twin Pack',
    variant: 'Original',
    net_content: 150,
    unit_of_measure: 'g',
    multipack_units: 2
  });
  assert(
    singlePack.canonical_sku_id !== twinPack.canonical_sku_id,
    'Multipack separation: Twin pack does not collide with single pack SKU ID',
    `Single: ${singlePack.canonical_sku_id}, Twin: ${twinPack.canonical_sku_id}`
  );

  // Test 4: Brand Normalization
  const brand1 = resolveBrandIdentity('Colgate');
  const brand2 = resolveBrandIdentity('  COLGATE ');
  assert(brand1.brand_id === 'colgate', 'Brand slug normalizes Colgate to colgate');
  assert(brand2.brand_id === 'colgate', 'Brand slug normalizes uppercase with whitespace to colgate');

  // Test 5: Ingestion Pipeline & Quality Audit on SAMPLE_TOOTHPASTES
  const auditResult = auditInMemoryProducts(SAMPLE_TOOTHPASTES);
  const dataset = productDataToDomain(SAMPLE_TOOTHPASTES, TOOTHPASTE_CATEGORY_CONFIG);

  assert(
    auditResult.totalRows === 34,
    `Fixture rows received: exactly 34 (got ${auditResult.totalRows})`
  );
  assert(
    auditResult.validRows === 34,
    `Valid rows accepted: 34 (got ${auditResult.validRows})`
  );
  assert(
    auditResult.rejectedRows === 0,
    `Rejected rows: 0 (got ${auditResult.rejectedRows})`
  );
  assert(
    auditResult.errorCount === 0,
    `Fatal error count: 0 (got ${auditResult.errorCount})`
  );
  assert(
    dataset.skus.size === 29,
    `Deduplication: 34 observations resolve to 29 canonical SKUs (got ${dataset.skus.size})`
  );

  // Test 6: Verify No Manufactured Attribute Defaults
  const herbalSkus = Array.from(dataset.skus.values()).filter((s) => s.attributes.herbal === true);
  const charcoalSkus = Array.from(dataset.skus.values()).filter((s) => s.attributes.charcoal === true);
  assert(
    herbalSkus.length > 0 && herbalSkus.length < 29,
    `Attribute accuracy: Herbal attribute is specifically assigned, not universally applied (count: ${herbalSkus.length})`
  );
  assert(
    charcoalSkus.length > 0 && charcoalSkus.length < 29,
    `Attribute accuracy: Charcoal attribute is specifically assigned, not universally applied (count: ${charcoalSkus.length})`
  );

  return { passed, failed, errors };
}
