/**
 * Deterministic Test Suite: Dedicated Market Signal Engine
 * 
 * Verifies:
 * - Deterministic triggering without mock alerts
 * - Exact observation ID and retailer linkages
 * - Mathematical formula transparency
 * - Threshold auditability
 */

import { generateMarketSignals, DEFAULT_SIGNAL_THRESHOLDS } from '../signals';
import { normalizeProducts } from '../../utils/calculations';
import { ProductData, NormalizedProduct } from '../../types';

export function runSignalsTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running Market Intelligence Signals Tests ---');

  const baseProductRaw: ProductData = {
    product_id: 'p1',
    brand: 'Colgate',
    product_name: 'Total Clean Mint',
    variant: 'Clean Mint',
    category: 'toothpaste',
    sub_category: 'Total Care',
    size_value: 150,
    size_unit: 'g',
    weight_grams: 150,
    volume_ml: null,
    is_multipack: false,
    multipack_count: 1,
    price_php: 145,
    regular_price_php: 145,
    sale_price_php: null,
    discount_percent: 0,
    retailer: 'SM Supermarket',
    retailer_type: 'Supermarket / Hypermarket',
    location: 'Metro Manila',
    date_collected: '2026-03-01',
    product_url: 'https://example.com/p1',
    rating: 4.6,
    review_count: 120,
    fluoride: true,
    whitening: false,
    sensitivity: false,
    anti_cavity: true,
    gum_care: false,
    herbal: false,
    charcoal: false,
    kids: false,
    premium_positioning: 'Mainstream',
    origin: 'Local',
    source: 'Audit'
  };

  const baseProduct: NormalizedProduct = normalizeProducts([baseProductRaw]).normalized[0];

  // Test 1: Deep Promotion Trigger
  const promoProductRaw: ProductData = {
    ...baseProductRaw,
    product_id: 'p-promo',
    price_php: 110,
    regular_price_php: 150,
    sale_price_php: 110,
    discount_percent: 26.7
  };
  const promoProduct: NormalizedProduct = normalizeProducts([promoProductRaw]).normalized[0];

  const promoSignals = generateMarketSignals([promoProduct], 95.0);
  const deepPromo = promoSignals.find((s) => s.signal_type === 'PRICE_DISCOUNT_DEEP');
  assert(
    Boolean(deepPromo),
    'Deep promotion signal triggered when discount >= 20%'
  );
  assert(
    deepPromo?.observation_ids.includes('p-promo') === true,
    'Deep promo signal links to the exact observation ID'
  );
  assert(
    deepPromo?.trigger_formula.includes('150') && deepPromo?.trigger_formula.includes('110'),
    'Deep promo signal includes auditable mathematical formula'
  );

  // Test 2: Cross-Channel Dispersion Trigger (Same SKU across 2 retailers)
  const smSku: NormalizedProduct = {
    ...baseProduct,
    product_id: 'colgate-sm',
    retailer: 'SM Supermarket',
    price_php: 130,
    price_per_100g: 86.67
  };
  const mercurySku: NormalizedProduct = {
    ...baseProduct,
    product_id: 'colgate-mercury',
    retailer: 'Mercury Drug',
    price_php: 160,
    price_per_100g: 106.67
  };

  const dispersionSignals = generateMarketSignals([smSku, mercurySku], 95.0);
  const dispSignal = dispersionSignals.find((s) => s.signal_type === 'CROSS_CHANNEL_DISPERSION');
  assert(
    Boolean(dispSignal),
    'Cross-channel dispersion signal triggered when price spread >= 15%'
  );
  assert(
    dispSignal?.observation_ids.length === 2 &&
    dispSignal.observation_ids.includes('colgate-sm') &&
    dispSignal.observation_ids.includes('colgate-mercury'),
    'Cross-channel signal links to all contributing retailer observations'
  );
  assert(
    dispSignal?.retailer_names.includes('SM Supermarket') &&
    dispSignal?.retailer_names.includes('Mercury Drug'),
    'Cross-channel signal records all retailer banners'
  );

  // Test 3: Pack Size Economics Inversion
  // 100g costs ₱80 (₱80/100g), but 150g costs ₱150 (₱100/100g) -> larger pack has HIGHER unit price!
  const smallPack: NormalizedProduct = {
    ...baseProduct,
    product_id: 'size-100g',
    size_value: 100,
    price_php: 80,
    price_per_100g: 80
  };
  const largePack: NormalizedProduct = {
    ...baseProduct,
    product_id: 'size-150g',
    size_value: 150,
    price_php: 150,
    price_per_100g: 100
  };

  const inversionSignals = generateMarketSignals([smallPack, largePack], 95.0);
  const invSignal = inversionSignals.find((s) => s.signal_type === 'PACK_SIZE_ECONOMICS_INVERSION');
  assert(
    Boolean(invSignal),
    'Pack size inversion signal triggered when larger size has higher unit price'
  );
  assert(
    invSignal?.observation_ids.includes('size-100g') && invSignal.observation_ids.includes('size-150g'),
    'Inversion signal links both small and large pack observation IDs'
  );

  return { passed, failed, errors };
}
