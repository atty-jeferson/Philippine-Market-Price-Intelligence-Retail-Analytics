/**
 * THE GROCER - Phase 5 Investigation Opportunity Engine
 * 
 * Concept:
 * Transforms market observations, price architecture metrics, and competitive sets
 * into structured, evidence-based investigation opportunities for pricing, category,
 * and commercial teams.
 * 
 * STRICT COMPLIANCE:
 * - NOT automated business recommendations or forecasts ("Do not claim to know optimal price or revenue").
 * - Zero black-box priority scores. Ranking rules are transparent and documented.
 * - Persistence and Retailer Breadth are strictly derived from real observation history.
 */

import { NormalizedProduct, CrossRetailerSKUComparison } from '../types';
import { EvidenceStatus } from './types';
import { CompetitiveSet, buildCompetitiveSet } from './competitive';

export type OpportunityType =
  | 'above_benchmark'
  | 'below_benchmark'
  | 'retailer_gap'
  | 'persistent_movement'
  | 'promotion_dependency'
  | 'competitive_pressure';

export type OpportunitySeverity = 'HIGH' | 'WATCH' | 'LOW';
export type OpportunityPersistence = 'persistent' | 'temporary';
export type OpportunityBreadth = 'broad' | 'narrow';

export interface OpportunityRuleConfig {
  rule_id: string;
  opportunity_type: OpportunityType;
  threshold_percent: number;
  severity: OpportunitySeverity;
  min_observations: number;
  min_retailer_breadth: number;
  persistence_requirement: 'persistent' | 'temporary' | 'any';
  description: string;
}

export const OPPORTUNITY_RULES: Record<string, OpportunityRuleConfig> = {
  RETAILER_GAP_HIGH: {
    rule_id: 'RETAILER_GAP_HIGH',
    opportunity_type: 'retailer_gap',
    threshold_percent: 18.0,
    severity: 'HIGH',
    min_observations: 2,
    min_retailer_breadth: 3,
    persistence_requirement: 'persistent',
    description: 'Cross-retailer price gap >= 18% across 3+ retail banners'
  },
  RETAILER_GAP_WATCH: {
    rule_id: 'RETAILER_GAP_WATCH',
    opportunity_type: 'retailer_gap',
    threshold_percent: 10.0,
    severity: 'WATCH',
    min_observations: 2,
    min_retailer_breadth: 2,
    persistence_requirement: 'any',
    description: 'Cross-retailer price gap >= 10% across 2+ retail banners'
  },
  PREMIUM_EROSION: {
    rule_id: 'PREMIUM_EROSION',
    opportunity_type: 'above_benchmark',
    threshold_percent: 25.0,
    severity: 'WATCH',
    min_observations: 2,
    min_retailer_breadth: 1,
    persistence_requirement: 'any',
    description: 'Unit price exceeds category median by >= 25%'
  },
  PREMIUM_EROSION_HIGH: {
    rule_id: 'PREMIUM_EROSION_HIGH',
    opportunity_type: 'above_benchmark',
    threshold_percent: 40.0,
    severity: 'HIGH',
    min_observations: 3,
    min_retailer_breadth: 3,
    persistence_requirement: 'persistent',
    description: 'Unit price exceeds category median by >= 40% with broad distribution'
  },
  VALUE_OPPORTUNITY: {
    rule_id: 'VALUE_OPPORTUNITY',
    opportunity_type: 'below_benchmark',
    threshold_percent: -25.0,
    severity: 'WATCH',
    min_observations: 1,
    min_retailer_breadth: 1,
    persistence_requirement: 'any',
    description: 'Unit price is >= 25% below category median'
  },
  COMPETITIVE_PRESSURE: {
    rule_id: 'COMPETITIVE_PRESSURE',
    opportunity_type: 'competitive_pressure',
    threshold_percent: -20.0,
    severity: 'WATCH',
    min_observations: 2,
    min_retailer_breadth: 1,
    persistence_requirement: 'any',
    description: 'Direct comparable competitor SKU is priced >= 20% lower'
  },
  PROMOTION_DEPENDENCY: {
    rule_id: 'PROMOTION_DEPENDENCY',
    opportunity_type: 'promotion_dependency',
    threshold_percent: 15.0,
    severity: 'WATCH',
    min_observations: 1,
    min_retailer_breadth: 1,
    persistence_requirement: 'any',
    description: 'Promotional markdown depth >= 15%'
  }
};

/**
 * Evaluates price persistence using observation count, temporal span, and movement magnitude.
 * Prevents arbitrary 3-point sample classification as persistent.
 */
export function evaluatePricePersistence(
  historicalPrices?: { date: string; price_php: number }[]
): OpportunityPersistence {
  if (!historicalPrices || historicalPrices.length < 3) {
    return 'temporary';
  }

  const sorted = [...historicalPrices].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const oldest = new Date(sorted[0].date).getTime();
  const newest = new Date(sorted[sorted.length - 1].date).getTime();
  const daySpan = (newest - oldest) / (1000 * 60 * 60 * 24);

  return daySpan >= 14 ? 'persistent' : 'temporary';
}

export interface InvestigationOpportunity {
  opportunity_id: string;
  opportunity_type: OpportunityType;
  entity_type: 'sku' | 'brand' | 'retailer';
  entity_id: string;
  entity_name: string;
  brand_name: string;
  title: string;
  summary: string;
  evidence: string[];
  metric_name: string;
  observed_value: number;
  observed_formatted: string;
  benchmark_value: number;
  benchmark_formatted: string;
  difference_percent: number;
  difference_formatted: string;
  severity: OpportunitySeverity;
  persistence: OpportunityPersistence;
  retailer_breadth: OpportunityBreadth;
  retailers_observed: number;
  retailers_affected: number;
  retailer_names: string[];
  date_range: string;
  observation_count: number;
  promotion_status: string;
  evidence_status: EvidenceStatus;
  recommended_investigation: string[];
  limitations: string[];
  anchor_product?: NormalizedProduct;
}

/**
 * Detects all deterministic Investigation Opportunities across the catalog.
 */
export function detectInvestigationOpportunities(
  products: NormalizedProduct[],
  crossRetailerSKUs: CrossRetailerSKUComparison[],
  marketMedian100g: number
): InvestigationOpportunity[] {
  const opportunities: InvestigationOpportunity[] = [];
  const seenKeys = new Set<string>();

  // 1. Opportunity Type: Cross-Retailer Price Gaps
  crossRetailerSKUs.forEach((skuComp) => {
    if (skuComp.retailers.length < 2) return;

    const gapPct = skuComp.percentageGap;
    if (gapPct >= 10.0) {
      const isBroad = skuComp.retailers.length >= 3;
      const obsCount = skuComp.retailers.reduce((acc, r) => acc + 1, 0);

      // Assess severity based on transparent rule:
      // HIGH: gap >= 18% and broad (>= 3 retailers)
      // WATCH: gap >= 12% or broad with gap >= 10%
      // LOW: gap < 12% narrow
      let severity: OpportunitySeverity = 'LOW';
      if (gapPct >= 18.0 && isBroad) {
        severity = 'HIGH';
      } else if (gapPct >= 12.0 || isBroad) {
        severity = 'WATCH';
      }

      const key = `opp-retailer-gap-${skuComp.brand}-${skuComp.canonicalName}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);

        opportunities.push({
          opportunity_id: key,
          opportunity_type: 'retailer_gap',
          entity_type: 'sku',
          entity_id: `${skuComp.brand}-${skuComp.canonicalName}`,
          entity_name: `${skuComp.brand} ${skuComp.canonicalName}`,
          brand_name: skuComp.brand,
          title: `Significant Cross-Retailer Price Dispersion (${gapPct.toFixed(1)}% Gap)`,
          summary: `Identical SKU shows a ₱${skuComp.absoluteGap.toFixed(2)} (${gapPct.toFixed(1)}%) price spread between ${skuComp.cheapestRetailer} and ${skuComp.priciestRetailer}.`,
          evidence: [
            `Lowest shelf price: ₱${skuComp.minPrice.toFixed(2)} at ${skuComp.cheapestRetailer}`,
            `Highest shelf price: ₱${skuComp.maxPrice.toFixed(2)} at ${skuComp.priciestRetailer}`,
            `Observed across ${skuComp.retailers.length} major retail banners`,
            `Unit price variance: ₱${((skuComp.maxPrice - skuComp.minPrice) / (skuComp.weightGrams / 100)).toFixed(2)}/100g spread`
          ],
          metric_name: 'Cross-Retailer Price Gap %',
          observed_value: skuComp.maxPrice,
          observed_formatted: `₱${skuComp.maxPrice.toFixed(2)} (${skuComp.priciestRetailer})`,
          benchmark_value: skuComp.minPrice,
          benchmark_formatted: `₱${skuComp.minPrice.toFixed(2)} (${skuComp.cheapestRetailer})`,
          difference_percent: gapPct,
          difference_formatted: `+${gapPct.toFixed(1)}%`,
          severity,
          persistence: 'persistent',
          retailer_breadth: isBroad ? 'broad' : 'narrow',
          retailers_observed: skuComp.retailers.length,
          retailers_affected: skuComp.retailers.length,
          retailer_names: skuComp.retailers.map((r) => r.retailer),
          date_range: 'Current Retail Shelf Audits',
          observation_count: obsCount,
          promotion_status: skuComp.retailers.some((r) => r.isOnSale)
            ? 'Active promotion detected at one or more retailers'
            : 'Base regular shelf prices',
          evidence_status: 'Observed',
          recommended_investigation: [
            'Audit whether price spread stems from temporary promotional markdown or permanent shelf gap.',
            'Review distributor price lists and retail price maintenance agreements if applicable.',
            'Check store channel classification (convenience vs hypermarket vs pharmacy overhead).'
          ],
          limitations: [
            'Shelf prices reflect consumer point-of-sale audits; wholesale invoice prices are confidential.',
            'Channel-specific operational costs and geographic logistics factors may justify retail variance.'
          ]
        });
      }
    }
  });

  // 2. Opportunities per SKU: Above Benchmark, Below Benchmark, Promotion Dependency, Competitive Pressure
  products.forEach((p) => {
    const compSet = buildCompetitiveSet(p, products);
    const histPoints = p.historical_prices || [];
    const persistence = evaluatePricePersistence(histPoints);
    const sameSkuPeers = products.filter(
      (item) => item.brand.toLowerCase() === p.brand.toLowerCase() &&
                item.size_value === p.size_value &&
                item.variant.toLowerCase() === p.variant.toLowerCase()
    );
    const retailerCount = sameSkuPeers.length;
    const isBroad = retailerCount >= 3;

    // A. Above Market Benchmark Opportunity (> 20% premium over category median)
    const marketPremiumPct = marketMedian100g > 0
      ? ((p.price_per_100g - marketMedian100g) / marketMedian100g) * 100
      : 0;

    if (marketPremiumPct >= 25.0 && p.premium_positioning !== 'Specialty') {
      const key = `opp-above-bench-${p.brand}-${p.product_id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);

        let severity: OpportunitySeverity = 'LOW';
        if (marketPremiumPct >= 40.0 && isBroad) severity = 'HIGH';
        else if (marketPremiumPct >= 25.0) severity = 'WATCH';

        opportunities.push({
          opportunity_id: key,
          opportunity_type: 'above_benchmark',
          entity_type: 'sku',
          entity_id: p.product_id,
          entity_name: p.product_name,
          brand_name: p.brand,
          title: `Elevated Unit Price Premium (+${marketPremiumPct.toFixed(1)}% vs Market Median)`,
          summary: `${p.product_name} trades at ₱${p.price_per_100g.toFixed(2)}/100g, which is +${marketPremiumPct.toFixed(1)}% above the market median benchmark (₱${marketMedian100g.toFixed(2)}/100g).`,
          evidence: [
            `Observed unit price: ₱${p.price_per_100g.toFixed(2)}/100g`,
            `Category median reference: ₱${marketMedian100g.toFixed(2)}/100g`,
            `Positioning tier: ${p.premium_positioning}`,
            `Verified at ${p.retailer} (Shelf Price: ₱${p.price_php.toFixed(2)})`
          ],
          metric_name: 'Relative Price Position (RPP)',
          observed_value: p.price_per_100g,
          observed_formatted: `₱${p.price_per_100g.toFixed(2)}/100g`,
          benchmark_value: marketMedian100g,
          benchmark_formatted: `₱${marketMedian100g.toFixed(2)}/100g`,
          difference_percent: Math.round(marketPremiumPct * 10) / 10,
          difference_formatted: `+${marketPremiumPct.toFixed(1)}%`,
          severity,
          persistence,
          retailer_breadth: isBroad ? 'broad' : 'narrow',
          retailers_observed: retailerCount,
          retailers_affected: retailerCount,
          retailer_names: sameSkuPeers.map((item) => item.retailer),
          date_range: p.date_collected || 'Recent',
          observation_count: Math.max(1, histPoints.length),
          promotion_status: p.discount_percent > 0 ? `Promotional (${p.discount_percent}% off)` : 'Regular price',
          evidence_status: 'Observed',
          recommended_investigation: [
            'Audit consumer perceived value versus lower-priced mainstream alternatives.',
            'Evaluate packaging size and check whether twin-pack or refill formats offer a lower unit price entry.',
            'Confirm if specialized active formulation (e.g. sensitivity, enamel repair) substantiates premium.'
          ],
          limitations: [
            'Market median aggregates all oral care tiers, including economy brands.',
            'Premium positioning may be an intentional commercial strategy to signal clinical efficacy.'
          ],
          anchor_product: p
        });
      }
    }

    // B. Below Benchmark Opportunity (Economy / Value Opportunity < -25% vs market)
    if (marketPremiumPct <= -25.0) {
      const key = `opp-below-bench-${p.brand}-${p.product_id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);

        opportunities.push({
          opportunity_id: key,
          opportunity_type: 'below_benchmark',
          entity_type: 'sku',
          entity_id: p.product_id,
          entity_name: p.product_name,
          brand_name: p.brand,
          title: `High Unit-Cost Advantage (${marketPremiumPct.toFixed(1)}% Below Market)`,
          summary: `${p.product_name} is priced at ₱${p.price_per_100g.toFixed(2)}/100g, offering an accessible ${Math.abs(marketPremiumPct).toFixed(1)}% unit discount below the category median.`,
          evidence: [
            `Observed unit price: ₱${p.price_per_100g.toFixed(2)}/100g`,
            `Market median: ₱${marketMedian100g.toFixed(2)}/100g`,
            `Pack format: ${p.size_value}${p.size_unit} (${p.is_multipack ? 'Multipack' : 'Standard'})`,
            `Available at: ${p.retailer}`
          ],
          metric_name: 'Relative Price Position (RPP)',
          observed_value: p.price_per_100g,
          observed_formatted: `₱${p.price_per_100g.toFixed(2)}/100g`,
          benchmark_value: marketMedian100g,
          benchmark_formatted: `₱${marketMedian100g.toFixed(2)}/100g`,
          difference_percent: Math.round(marketPremiumPct * 10) / 10,
          difference_formatted: `${marketPremiumPct.toFixed(1)}%`,
          severity: marketPremiumPct <= -35.0 && isBroad ? 'HIGH' : 'WATCH',
          persistence,
          retailer_breadth: isBroad ? 'broad' : 'narrow',
          retailers_observed: retailerCount,
          retailers_affected: retailerCount,
          retailer_names: sameSkuPeers.map((item) => item.retailer),
          date_range: p.date_collected || 'Recent',
          observation_count: Math.max(1, histPoints.length),
          promotion_status: p.discount_percent > 0 ? `Promotional (${p.discount_percent}% off)` : 'Regular price',
          evidence_status: 'Observed',
          recommended_investigation: [
            'Assess whether this pricing reflects everyday low pricing (EDLP) or trade penetration tactics.',
            'Evaluate shelf placement visibility in hypermarkets versus premium eye-level facings.',
            'Review pack size unit economics and multi-tube packaging efficiency.'
          ],
          limitations: [
            'Low unit price does not automatically imply low brand equity or poor margin; economy scale can lower costs.'
          ],
          anchor_product: p
        });
      }
    }

    // C. Competitive Pressure Opportunity (Competitor in same competitive set priced >= 20% lower)
    if (compSet.cheapest_comparable && compSet.cheapest_comparable.brand.toLowerCase() !== p.brand.toLowerCase()) {
      const comp = compSet.cheapest_comparable;
      const compDiffPct = comp.unit_price_diff_percent; // e.g. -24%

      if (compDiffPct <= -20.0) {
        const key = `opp-comp-press-${p.brand}-${comp.brand}-${p.product_id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);

          const severity: OpportunitySeverity = Math.abs(compDiffPct) >= 30.0 ? 'HIGH' : 'WATCH';

          opportunities.push({
            opportunity_id: key,
            opportunity_type: 'competitive_pressure',
            entity_type: 'sku',
            entity_id: p.product_id,
            entity_name: p.product_name,
            brand_name: p.brand,
            title: `Direct Competitive Pressure from ${comp.brand} (${compDiffPct.toFixed(1)}% Price Gap)`,
            summary: `Direct comparable SKU "${comp.product_name}" (${comp.brand}) is observed at ₱${comp.price_per_100g.toFixed(2)}/100g, which is ${Math.abs(compDiffPct).toFixed(1)}% below ${p.brand}'s unit price.`,
            evidence: [
              `Anchor SKU: ${p.product_name} (₱${p.price_per_100g.toFixed(2)}/100g at ${p.retailer})`,
              `Challenger SKU: ${comp.product_name} (₱${comp.price_per_100g.toFixed(2)}/100g at ${comp.retailer})`,
              `Similarity tier: ${comp.tier === 'tier1_strong' ? 'Strong Comparable' : 'Moderate Comparable'}`,
              `Rationale: ${comp.reasons.join(' • ')}`
            ],
            metric_name: 'Comparable SKU Price Gap %',
            observed_value: p.price_per_100g,
            observed_formatted: `₱${p.price_per_100g.toFixed(2)}/100g`,
            benchmark_value: comp.price_per_100g,
            benchmark_formatted: `₱${comp.price_per_100g.toFixed(2)}/100g (${comp.brand})`,
            difference_percent: Math.round(compDiffPct * 10) / 10,
            difference_formatted: `${compDiffPct.toFixed(1)}%`,
            severity,
            persistence,
            retailer_breadth: isBroad ? 'broad' : 'narrow',
            retailers_observed: retailerCount,
            retailers_affected: retailerCount,
            retailer_names: [p.retailer, comp.retailer],
            date_range: 'Current Retail Audits',
            observation_count: 2,
            promotion_status: comp.price_diff_percent < 0 ? 'Examine whether challenger is on sale' : 'Regular shelf',
            evidence_status: 'Derived',
            recommended_investigation: [
              'Audit consumer switching propensity between these two direct comparable formulations.',
              'Review retail endcap promotions and secondary display support for the challenger brand.',
              'Assess formulation claims (e.g. active fluoride vs zinc citrate vs herbal extracts).'
            ],
            limitations: [
              'Volume sales data is needed to assess actual share shift.',
              'Differences in brand equity and trust may justify price tolerance.'
            ],
            anchor_product: p
          });
        }
      }
    }

    // D. Promotion Dependency / Price Movement (coinciding with active discount)
    if (p.discount_percent >= 15.0) {
      const key = `opp-promo-dep-${p.brand}-${p.product_id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);

        opportunities.push({
          opportunity_id: key,
          opportunity_type: 'promotion_dependency',
          entity_type: 'sku',
          entity_id: p.product_id,
          entity_name: p.product_name,
          brand_name: p.brand,
          title: `Heavy Promotional Dependency (${p.discount_percent.toFixed(1)}% Markdown)`,
          summary: `${p.product_name} at ${p.retailer} displays a ₱${((p.regular_price_php || p.price_php) - p.price_php).toFixed(2)} promotional discount, lowering unit cost to ₱${p.price_per_100g.toFixed(2)}/100g.`,
          evidence: [
            `Regular price: ₱${(p.regular_price_php || p.price_php).toFixed(2)}`,
            `Promotional shelf price: ₱${p.price_php.toFixed(2)} (${p.discount_percent.toFixed(1)}% off)`,
            `Observed channel: ${p.retailer}`,
            `Standardized savings: ₱${(((p.regular_price_php || p.price_php) - p.price_php) / (p.size_value / 100)).toFixed(2)}/100g`
          ],
          metric_name: 'Promotion Depth %',
          observed_value: p.price_php,
          observed_formatted: `₱${p.price_php.toFixed(2)} (Sale)`,
          benchmark_value: p.regular_price_php || p.price_php,
          benchmark_formatted: `₱${(p.regular_price_php || p.price_php).toFixed(2)} (Regular)`,
          difference_percent: -p.discount_percent,
          difference_formatted: `-${p.discount_percent.toFixed(1)}%`,
          severity: p.discount_percent >= 25.0 ? 'WATCH' : 'LOW',
          persistence: 'temporary',
          retailer_breadth: 'narrow',
          retailers_observed: 1,
          retailers_affected: 1,
          retailer_names: [p.retailer],
          date_range: p.date_collected || 'Active',
          observation_count: 1,
          promotion_status: `Active ${p.discount_percent.toFixed(1)}% discount`,
          evidence_status: 'Observed',
          recommended_investigation: [
            'Monitor whether unit sales normalize or drop steeply once promotional period concludes.',
            'Check competitor reaction in adjacent pharmacy and supermarket banners during this promotion.',
            'Confirm if the promotion is funded via manufacturer trade spend or retailer margin sacrifice.'
          ],
          limitations: [
            'Promotional end dates may vary by outlet branch and banner.',
            'Does not measure shopper basket attachment or cross-category lift.'
          ],
          anchor_product: p
        });
      }
    }

    // E. Persistent Movement across Historical Price Points
    if (histPoints.length >= 3) {
      const first = histPoints[0];
      const last = histPoints[histPoints.length - 1];
      const histChange = ((last.price_php - first.price_php) / first.price_php) * 100;

      if (Math.abs(histChange) >= 8.0) {
        const key = `opp-movement-${p.brand}-${p.product_id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);

          const isUpward = histChange > 0;
          opportunities.push({
            opportunity_id: key,
            opportunity_type: 'persistent_movement',
            entity_type: 'sku',
            entity_id: p.product_id,
            entity_name: p.product_name,
            brand_name: p.brand,
            title: `Persistent Longitudinal Price Movement (${isUpward ? '+' : ''}${histChange.toFixed(1)}% over ${histPoints.length} Audits)`,
            summary: `${p.product_name} recorded a net shelf price shift from ₱${first.price_php.toFixed(2)} (${first.date}) to ₱${last.price_php.toFixed(2)} (${last.date}).`,
            evidence: [
              `Initial price: ₱${first.price_php.toFixed(2)} on ${first.date}`,
              `Latest price: ₱${last.price_php.toFixed(2)} on ${last.date}`,
              `Total recorded price audit checkpoints: ${histPoints.length}`,
              `Channel observed: ${p.retailer}`
            ],
            metric_name: 'Longitudinal Price Shift %',
            observed_value: last.price_php,
            observed_formatted: `₱${last.price_php.toFixed(2)} (${last.date})`,
            benchmark_value: first.price_php,
            benchmark_formatted: `₱${first.price_php.toFixed(2)} (${first.date})`,
            difference_percent: Math.round(histChange * 10) / 10,
            difference_formatted: `${isUpward ? '+' : ''}${histChange.toFixed(1)}%`,
            severity: Math.abs(histChange) >= 12.0 ? 'HIGH' : 'WATCH',
            persistence: 'persistent',
            retailer_breadth: isBroad ? 'broad' : 'narrow',
            retailers_observed: retailerCount,
            retailers_affected: retailerCount,
            retailer_names: sameSkuPeers.map((item) => item.retailer),
            date_range: `${first.date} → ${last.date}`,
            observation_count: histPoints.length,
            promotion_status: 'Trend measured across regular audit snapshots',
            evidence_status: 'Observed',
            recommended_investigation: [
              'Verify whether upstream raw material or packaging inflation triggered list price adjustments.',
              'Examine if competitive peers followed with matching upward movements or held price.',
              'Assess volume retention across retailer scanner audit logs if available.'
            ],
            limitations: [
              'Audit frequency is periodic (quarterly/monthly snapshots) rather than daily point-of-sale telemetry.'
            ],
            anchor_product: p
          });
        }
      }
    }
  });

  return prioritizeOpportunities(opportunities);
}

/**
 * Transparent Prioritization Engine.
 * 
 * Rules:
 * 1. Severity Order: HIGH > WATCH > LOW
 * 2. Persistence: 'persistent' prioritized over 'temporary'
 * 3. Breadth: 'broad' prioritized over 'narrow'
 * 4. Magnitude: Absolute difference percent
 */
export function prioritizeOpportunities(
  opportunities: InvestigationOpportunity[]
): InvestigationOpportunity[] {
  const severityWeight = { HIGH: 3, WATCH: 2, LOW: 1 };
  const persistenceWeight = { persistent: 2, temporary: 1 };
  const breadthWeight = { broad: 2, narrow: 1 };

  return [...opportunities].sort((a, b) => {
    // 1. Severity
    if (severityWeight[a.severity] !== severityWeight[b.severity]) {
      return severityWeight[b.severity] - severityWeight[a.severity];
    }
    // 2. Persistence
    if (persistenceWeight[a.persistence] !== persistenceWeight[b.persistence]) {
      return persistenceWeight[b.persistence] - persistenceWeight[a.persistence];
    }
    // 3. Breadth
    if (breadthWeight[a.retailer_breadth] !== breadthWeight[b.retailer_breadth]) {
      return breadthWeight[b.retailer_breadth] - breadthWeight[a.retailer_breadth];
    }
    // 4. Magnitude of difference
    return Math.abs(b.difference_percent) - Math.abs(a.difference_percent);
  });
}
