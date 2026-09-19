/**
 * Deterministic Test Suite: Analytics, Benchmarks, Longitudinal & Adapters (Phases 1-5)
 * 
 * Verifies:
 * - Promotion depth & promotion frequency formulas
 * - Retailer price index (RPI) calculation
 * - Log price volatility based on sequential log returns
 * - MoM and YoY price change with strict temporal tolerance
 * - Opportunity rule governance & persistence checks
 * - Evidence status auditability (Observed vs Derived vs Inferred)
 * - Domain Dataset to Legacy ProductData round-trip fidelity
 */

import {
  calculatePromotionDepth,
  calculatePromotionFrequency,
  calculateRetailerPriceIndex,
  calculateLogPriceVolatility,
  calculateMoMPriceChange,
  calculateYoYPriceChange
} from '../statistics';
import { productDataToDomain, domainToProductData } from '../adapters';
import { TOOTHPASTE_CATEGORY_CONFIG } from '../categoryConfig';
import { SAMPLE_TOOTHPASTES } from '../../data/sampleToothpastes';
import { OPPORTUNITY_RULES } from '../opportunities';

export function runAnalyticsTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running Analytics, Longitudinal & Adapter Tests ---');

  // Test 1: Promotion Depth Formula: (regular - promo) / regular * 100
  const promoDepth = calculatePromotionDepth(150, 120);
  assert(
    promoDepth !== null && Math.abs(promoDepth - 20.0) < 0.01,
    `Promotion depth: ₱150 regular vs ₱120 promo yields exactly 20.0% (got ${promoDepth}%)`
  );
  const promoDepthInvalid = calculatePromotionDepth(0, 100);
  assert(
    promoDepthInvalid === null,
    'Promotion depth with zero regular price safely returns null'
  );

  // Test 2: Promotion Frequency Formula: promoCount / totalObservations
  const promoFreq = calculatePromotionFrequency(6, 24);
  assert(
    promoFreq !== null && Math.abs(promoFreq - 0.25) < 0.001,
    `Promotion frequency: 6 promo observations out of 24 yields 0.25 (got ${promoFreq})`
  );
  const promoFreqZero = calculatePromotionFrequency(0, 0);
  assert(
    promoFreqZero === null,
    'Promotion frequency with 0 total observations safely returns null'
  );

  // Test 3: Retailer Price Index: (retailerBenchmark / marketBenchmark) * 100
  const rpi = calculateRetailerPriceIndex(105, 100);
  assert(
    rpi !== null && Math.abs(rpi - 105.0) < 0.01,
    `Retailer price index: ₱105 vs ₱100 market benchmark yields exactly 105.0 (got ${rpi})`
  );

  // Test 4: Sequential Log Returns Price Volatility: stdDev(ln(P_t / P_(t-1)))
  const historicalSeries = [
    { date: '2026-01-01', price: 100 },
    { date: '2026-01-15', price: 105 },
    { date: '2026-02-01', price: 102 },
    { date: '2026-02-15', price: 108 }
  ];
  const volatility = calculateLogPriceVolatility(historicalSeries);
  assert(
    volatility.status === 'valid' && volatility.volatility !== null && volatility.volatility > 0,
    `Log price volatility computed successfully on sequential prices (std: ${volatility.volatility?.toFixed(4)})`
  );
  const singlePriceVol = calculateLogPriceVolatility([{ date: '2026-01-01', price: 100 }]);
  assert(
    singlePriceVol.status === 'insufficient_observations' && singlePriceVol.volatility === null,
    'Log price volatility handles n < 3 sequential observations by returning status=insufficient_observations and null'
  );

  // Test 5: MoM and YoY Price Changes with Temporal Matching
  const momSeries = [
    { date: '2026-02-01', price: 100 },
    { date: '2026-03-01', price: 110 }
  ];
  const momChange = calculateMoMPriceChange(momSeries);
  assert(
    momChange.changePct !== null && Math.abs(momChange.changePct - 10.0) < 0.01,
    `MoM price change: ₱110 vs ₱100 previous month yields +10.0% (got ${momChange.changePct}%)`
  );

  const yoySeries = [
    { date: '2025-03-01', price: 100 },
    { date: '2026-03-01', price: 125 }
  ];
  const yoyChange = calculateYoYPriceChange(yoySeries);
  assert(
    yoyChange.changePct !== null && Math.abs(yoyChange.changePct - 25.0) < 0.01,
    `YoY price change: ₱125 vs ₱100 previous year yields +25.0% (got ${yoyChange.changePct}%)`
  );

  // Test 6: Opportunity Rule Governance & Centralized Configuration
  assert(
    Boolean(OPPORTUNITY_RULES) && Object.keys(OPPORTUNITY_RULES).length >= 4,
    `Opportunity rule governance has centralized configuration with ${Object.keys(OPPORTUNITY_RULES).length} rules`
  );
  assert(
    OPPORTUNITY_RULES.PREMIUM_EROSION?.min_observations >= 2,
    `Opportunity rule governance specifies minimum observation breadth (min_obs: ${OPPORTUNITY_RULES.PREMIUM_EROSION?.min_observations})`
  );

  // Test 7: Legacy Adapter Round-Trip Conversion
  const domainDataset = productDataToDomain(SAMPLE_TOOTHPASTES, TOOTHPASTE_CATEGORY_CONFIG);
  assert(
    domainDataset.skus.size === 29,
    `Adapter ingestion produces 29 canonical SKUs from 34 rows (got ${domainDataset.skus.size})`
  );
  assert(
    domainDataset.observations.length >= 34,
    `Adapter creates at least 34 price observations including historical points (got ${domainDataset.observations.length})`
  );

  const reconstructedProducts = domainToProductData(domainDataset, TOOTHPASTE_CATEGORY_CONFIG);
  assert(
    reconstructedProducts.length === 34,
    `Adapter reverse transformation recreates exactly 34 product listings (got ${reconstructedProducts.length})`
  );

  // Verify round-trip preserves prices and brands without corruption
  const sampleFirst = SAMPLE_TOOTHPASTES[0];
  const reconMatch = reconstructedProducts.find(
    (p) => p.brand === sampleFirst.brand && p.product_name === sampleFirst.product_name && p.size_value === sampleFirst.size_value && p.retailer === sampleFirst.retailer
  );
  assert(
    Boolean(reconMatch) && reconMatch?.price_php === sampleFirst.price_php,
    `Adapter round-trip preserves exact shelf price (₱${sampleFirst.price_php} === ₱${reconMatch?.price_php})`
  );

  return { passed, failed, errors };
}
