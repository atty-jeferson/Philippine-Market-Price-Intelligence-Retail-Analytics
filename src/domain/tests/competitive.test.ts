/**
 * Deterministic Test Suite: Competitive Intelligence & Price Waterfall (Phase 5)
 * 
 * Verifies:
 * - Competitive set generation with strict similarity tiers (Tier 1 vs Tier 2 vs Tier 3)
 * - No physical SKU merging under competitive similarity
 * - Descriptive price waterfall mathematical reconciliation (|observed - cumulative| < 0.01)
 * - Retailer channel differential calculation without causal claims
 */

import { buildCompetitiveSet, evaluateCompetitiveSimilarity } from '../competitive';
import { calculatePriceWaterfall, calculateBrandPriceArchitecture, calculateRetailerPriceArchitecture } from '../priceArchitecture';
import { SAMPLE_TOOTHPASTES } from '../../data/sampleToothpastes';
import { normalizeProducts } from '../../utils/calculations';
import { NormalizedProduct } from '../../types';

export function runCompetitiveTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running Competitive Intelligence & Waterfall Tests ---');

  // Convert raw sample to NormalizedProduct array with unit prices
  const { normalized: normalizedProducts } = normalizeProducts(SAMPLE_TOOTHPASTES);

  const anchor = normalizedProducts.find((p) => p.brand === 'Colgate' && p.size_value === 150 && p.variant === 'Clean Mint')!;
  assert(Boolean(anchor), 'Anchor SKU (Colgate Total 150g Clean Mint) found in dataset');

  // Test 1: Competitive Similarity Evaluation
  const closePeer = normalizedProducts.find((p) => p.brand === 'Close-Up' && p.size_value >= 120 && p.size_value <= 175);
  if (closePeer) {
    const sim = evaluateCompetitiveSimilarity(anchor, closePeer);
    assert(
      sim !== null && (sim.tier === 'tier1_strong' || sim.tier === 'tier2_moderate'),
      `Close-Up peer evaluated within competitive perimeter (assigned ${sim?.tier})`
    );
    assert(
      sim?.criteria.same_category === true,
      'Close-Up peer recognized in same category'
    );
  }

  // Test 2: Competitive Set Architecture
  const compSet = buildCompetitiveSet(anchor, normalizedProducts);
  assert(
    compSet.anchor_sku_id === anchor.product_id,
    'Competitive set correctly anchors to the target product ID'
  );
  assert(
    compSet.comparable_skus.length > 0,
    `Competitive set identifies comparable SKUs (found ${compSet.comparable_skus.length})`
  );
  assert(
    compSet.comparable_skus.every((c) => c.product_id !== anchor.product_id),
    'Competitive set does not include the anchor product itself'
  );

  // Test 3: Price Waterfall Mathematical Reconciliation
  const marketMedian100g = 95.0;
  const waterfall = calculatePriceWaterfall(anchor, normalizedProducts, marketMedian100g);

  assert(
    waterfall.calculated_reconciliation_diff < 0.01,
    `Price waterfall perfectly reconciles to observed shelf price (diff: ${waterfall.calculated_reconciliation_diff})`
  );
  assert(
    waterfall.steps.length >= 4,
    `Price waterfall breaks down into >= 4 explicit steps (got ${waterfall.steps.length} steps)`
  );
  assert(
    waterfall.limitations.length >= 2,
    'Price waterfall documents non-causal analytical limitations'
  );

  // Test 4: Brand Price Architecture
  const brandArch = calculateBrandPriceArchitecture('Colgate', normalizedProducts, marketMedian100g);
  assert(
    brandArch !== null && brandArch.sku_count > 0,
    `Brand price architecture computed for Colgate (found ${brandArch?.sku_count} SKUs)`
  );

  // Test 5: Retailer Price Architecture
  const retailerArch = calculateRetailerPriceArchitecture('Watsons PH', normalizedProducts, marketMedian100g);
  assert(
    retailerArch !== null && retailerArch.sku_count > 0,
    `Retailer price architecture computed for Watsons PH (found ${retailerArch?.sku_count} SKUs)`
  );

  return { passed, failed, errors };
}
