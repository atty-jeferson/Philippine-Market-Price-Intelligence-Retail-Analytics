/**
 * THE GROCER - Phase 5 Competitive Intelligence Engine
 * 
 * Concept: Deterministic Competitive Set & Similarity Framework
 * 
 * STRICT ARCHITECTURAL PRINCIPLE:
 * Identity resolution and competitive similarity are distinct concepts:
 * - Identity Resolution determines if two records refer to the SAME physical SKU.
 * - Competitive Similarity determines if two DISTINCT SKUs are commercially comparable.
 * We NEVER silently merge products merely because they are in the same competitive set.
 */

import { NormalizedProduct } from '../types';
import { EvidenceStatus } from './types';

export type SimilarityTier = 'tier1_strong' | 'tier2_moderate' | 'tier3_contextual';

export interface CompetitiveCriteria {
  same_category: boolean;
  same_subcategory: boolean;
  size_ratio: number;           // candidate_size / anchor_size
  size_difference_percent: number;
  shared_functional_attributes: string[];
  same_positioning_tier: boolean;
  explanation: string;
}

export interface ComparableSKU {
  sku_id: string;
  product_id: string;
  product_name: string;
  brand: string;
  size_value: number;
  size_unit: string;
  retailer: string;
  price_php: number;
  price_per_100g: number;
  positioning_tier: string;
  tier: SimilarityTier;
  criteria: CompetitiveCriteria;
  reasons: string[];
  price_diff_percent: number;       // (candidate_price - anchor_price) / anchor_price * 100
  unit_price_diff_percent: number;  // (candidate_unit - anchor_unit) / anchor_unit * 100
  normalized_product: NormalizedProduct;
}

export interface CompetitiveSet {
  competitive_set_id: string;
  anchor_sku_id: string;
  anchor_product: NormalizedProduct;
  comparable_skus: ComparableSKU[];
  tier1_count: number;
  tier2_count: number;
  tier3_count: number;
  median_shelf_price: number;
  median_unit_price: number;
  cheapest_comparable: ComparableSKU | null;
  priciest_comparable: ComparableSKU | null;
  created_at: string;
  evidence_status: EvidenceStatus;
  limitations: string[];
}

/**
 * Extract comparable functional attributes from a normalized product.
 */
function getFunctionalAttributes(p: NormalizedProduct): string[] {
  const attrs: string[] = [];
  if (p.whitening) attrs.push('Whitening');
  if (p.sensitivity) attrs.push('Sensitivity Relief');
  if (p.anti_cavity) attrs.push('Anti-Cavity');
  if (p.gum_care) attrs.push('Gum Care');
  if (p.herbal) attrs.push('Herbal / Natural');
  if (p.charcoal) attrs.push('Charcoal / Detox');
  if (p.fluoride) attrs.push('Fluoride Enriched');
  if (p.kids) attrs.push('Pediatric / Kids');
  return attrs;
}

/**
 * Deterministically evaluates competitive similarity between an anchor SKU and a candidate SKU.
 * Returns similarity tier, criteria, and transparent rationale.
 * Returns null if the items are outside the competitive perimeter (e.g. different main category).
 */
export function evaluateCompetitiveSimilarity(
  anchor: NormalizedProduct,
  candidate: NormalizedProduct
): { tier: SimilarityTier; criteria: CompetitiveCriteria; reasons: string[] } | null {
  // Reject if different root category
  const anchorCat = (anchor.category || 'toothpaste').toLowerCase().trim();
  const candidateCat = (candidate.category || 'toothpaste').toLowerCase().trim();
  if (anchorCat !== candidateCat) {
    return null;
  }

  // Do not compare an item against its exact same retailer observation instance
  if (anchor.product_id === candidate.product_id) {
    return null;
  }

  const anchorSubcat = (anchor.sub_category || '').toLowerCase().trim();
  const candidateSubcat = (candidate.sub_category || '').toLowerCase().trim();
  const sameSubcat = Boolean(anchorSubcat && candidateSubcat && anchorSubcat === candidateSubcat);

  const anchorSize = anchor.weight_grams || anchor.size_value || 100;
  const candidateSize = candidate.weight_grams || candidate.size_value || 100;
  const sizeRatio = candidateSize / (anchorSize || 1);
  const sizeDiffPct = Math.round(Math.abs(sizeRatio - 1) * 100);

  const anchorAttrs = getFunctionalAttributes(anchor);
  const candidateAttrs = getFunctionalAttributes(candidate);
  const sharedAttrs = anchorAttrs.filter((a) => candidateAttrs.includes(a));

  const sameTier = anchor.premium_positioning === candidate.premium_positioning;
  const isSameBrand = anchor.brand.toLowerCase() === candidate.brand.toLowerCase();

  const reasons: string[] = [];

  // Evaluation Hierarchy:
  // Tier 1 — Strong Comparable:
  // - Same category and subcategory (or high attribute overlap >= 2)
  // - Pack size within ±30% (size ratio between 0.70 and 1.35)
  // - Same or adjacent positioning tier
  const sizeIsClose = sizeRatio >= 0.70 && sizeRatio <= 1.35;
  const hasStrongAttributeOverlap = sharedAttrs.length >= 2 || (anchorAttrs.length <= 1 && sharedAttrs.length === anchorAttrs.length);

  if ((sameSubcat || hasStrongAttributeOverlap) && sizeIsClose && (sameTier || isSameBrand)) {
    reasons.push(`Direct segment match (${candidate.sub_category || 'Identical formulation segment'})`);
    reasons.push(`Comparable pack size (${candidate.size_value}${candidate.size_unit} vs anchor ${anchor.size_value}${anchor.size_unit}, ${sizeDiffPct}% variance)`);
    if (sharedAttrs.length > 0) {
      reasons.push(`Shared functional features: ${sharedAttrs.join(', ')}`);
    }
    if (sameTier) {
      reasons.push(`Aligned positioning tier: ${anchor.premium_positioning}`);
    }

    const explanation = `Strong direct comparable: aligned sub-category, close package volume (±${sizeDiffPct}%), and overlapping core benefits.`;

    return {
      tier: 'tier1_strong',
      criteria: {
        same_category: true,
        same_subcategory: sameSubcat,
        size_ratio: Math.round(sizeRatio * 100) / 100,
        size_difference_percent: sizeDiffPct,
        shared_functional_attributes: sharedAttrs,
        same_positioning_tier: sameTier,
        explanation
      },
      reasons
    };
  }

  // Tier 2 — Moderate Comparable:
  // - Same category, but either pack size differs materially (> 30%) or positioning tier differs (e.g. Mainstream vs Premium),
  //   or sub-category differs but shared functional benefits exist.
  const hasAnySharedAttribute = sharedAttrs.length >= 1;
  const sizeIsModeratelyClose = sizeRatio >= 0.40 && sizeRatio <= 2.50;

  if ((sameSubcat || hasAnySharedAttribute) && sizeIsModeratelyClose) {
    if (!sameSubcat) {
      reasons.push(`Contrasting sub-segment (${candidate.sub_category || 'General'} vs ${anchor.sub_category || 'General'})`);
    } else {
      reasons.push(`Same sub-segment (${anchor.sub_category})`);
    }

    if (!sizeIsClose) {
      reasons.push(`Substantial format difference (${candidate.size_value}${candidate.size_unit} vs ${anchor.size_value}${anchor.size_unit}, ${sizeDiffPct}% variance)`);
    } else {
      reasons.push(`Similar size format (${sizeDiffPct}% variance)`);
    }

    if (!sameTier) {
      reasons.push(`Cross-tier pricing (${candidate.premium_positioning} vs ${anchor.premium_positioning})`);
    }

    if (sharedAttrs.length > 0) {
      reasons.push(`Shared feature: ${sharedAttrs.join(', ')}`);
    }

    const explanation = `Moderate comparable: same core category with moderate functional or size format substitution potential.`;

    return {
      tier: 'tier2_moderate',
      criteria: {
        same_category: true,
        same_subcategory: sameSubcat,
        size_ratio: Math.round(sizeRatio * 100) / 100,
        size_difference_percent: sizeDiffPct,
        shared_functional_attributes: sharedAttrs,
        same_positioning_tier: sameTier,
        explanation
      },
      reasons
    };
  }

  // Tier 3 — Contextual Comparable:
  // - Same category, but wide divergence in size format, divergent positioning, or differing product concept.
  reasons.push(`Broad category peer (${candidate.category})`);
  if (!sameSubcat) reasons.push(`Different specialty focus (${candidate.sub_category || 'Standard'})`);
  if (sizeDiffPct > 50) reasons.push(`Distinct packaging tier (${candidate.size_value}${candidate.size_unit})`);

  const explanation = `Contextual peer: represents broader category basket competition rather than direct substitution.`;

  return {
    tier: 'tier3_contextual',
    criteria: {
      same_category: true,
      same_subcategory: sameSubcat,
      size_ratio: Math.round(sizeRatio * 100) / 100,
      size_difference_percent: sizeDiffPct,
      shared_functional_attributes: sharedAttrs,
      same_positioning_tier: sameTier,
      explanation
    },
    reasons
  };
}

/**
 * Builds a deterministic Competitive Set for a designated anchor SKU.
 */
export function buildCompetitiveSet(
  anchor: NormalizedProduct,
  allProducts: NormalizedProduct[]
): CompetitiveSet {
  const comparables: ComparableSKU[] = [];

  // Avoid duplicate SKU listings from same retailer / duplicate IDs
  const seenIds = new Set<string>();

  allProducts.forEach((candidate) => {
    if (candidate.product_id === anchor.product_id || seenIds.has(candidate.product_id)) {
      return;
    }

    const evaluation = evaluateCompetitiveSimilarity(anchor, candidate);
    if (!evaluation) return;

    seenIds.add(candidate.product_id);

    const priceDiffPct = anchor.price_php > 0
      ? Math.round(((candidate.price_php - anchor.price_php) / anchor.price_php) * 1000) / 10
      : 0;

    const unitDiffPct = anchor.price_per_100g > 0
      ? Math.round(((candidate.price_per_100g - anchor.price_per_100g) / anchor.price_per_100g) * 1000) / 10
      : 0;

    comparables.push({
      sku_id: candidate.product_id,
      product_id: candidate.product_id,
      product_name: candidate.product_name,
      brand: candidate.brand,
      size_value: candidate.size_value,
      size_unit: candidate.size_unit,
      retailer: candidate.retailer,
      price_php: candidate.price_php,
      price_per_100g: candidate.price_per_100g,
      positioning_tier: candidate.premium_positioning,
      tier: evaluation.tier,
      criteria: evaluation.criteria,
      reasons: evaluation.reasons,
      price_diff_percent: priceDiffPct,
      unit_price_diff_percent: unitDiffPct,
      normalized_product: candidate
    });
  });

  // Sort comparables: Tier 1 first, then by unit price proximity
  comparables.sort((a, b) => {
    const tierPriority = { tier1_strong: 1, tier2_moderate: 2, tier3_contextual: 3 };
    if (tierPriority[a.tier] !== tierPriority[b.tier]) {
      return tierPriority[a.tier] - tierPriority[b.tier];
    }
    return Math.abs(a.unit_price_diff_percent) - Math.abs(b.unit_price_diff_percent);
  });

  const tier1Count = comparables.filter((c) => c.tier === 'tier1_strong').length;
  const tier2Count = comparables.filter((c) => c.tier === 'tier2_moderate').length;
  const tier3Count = comparables.filter((c) => c.tier === 'tier3_contextual').length;

  const unitPrices = comparables.map((c) => c.price_per_100g).sort((a, b) => a - b);
  const shelfPrices = comparables.map((c) => c.price_php).sort((a, b) => a - b);

  const medianUnitPrice = unitPrices.length > 0
    ? unitPrices[Math.floor(unitPrices.length / 2)]
    : anchor.price_per_100g;

  const medianShelfPrice = shelfPrices.length > 0
    ? shelfPrices[Math.floor(shelfPrices.length / 2)]
    : anchor.price_php;

  // Find cheapest and priciest among Tier 1 & 2 comparables
  const directComparables = comparables.filter((c) => c.tier === 'tier1_strong' || c.tier === 'tier2_moderate');
  const pool = directComparables.length > 0 ? directComparables : comparables;

  let cheapest: ComparableSKU | null = null;
  let priciest: ComparableSKU | null = null;

  if (pool.length > 0) {
    const sortedByUnit = [...pool].sort((a, b) => a.price_per_100g - b.price_per_100g);
    cheapest = sortedByUnit[0];
    priciest = sortedByUnit[sortedByUnit.length - 1];
  }

  return {
    competitive_set_id: `cset-${anchor.product_id}`,
    anchor_sku_id: anchor.product_id,
    anchor_product: anchor,
    comparable_skus: comparables,
    tier1_count: tier1Count,
    tier2_count: tier2Count,
    tier3_count: tier3Count,
    median_unit_price: Math.round(medianUnitPrice * 100) / 100,
    median_shelf_price: Math.round(medianShelfPrice * 100) / 100,
    cheapest_comparable: cheapest,
    priciest_comparable: priciest,
    created_at: new Date().toISOString().split('T')[0],
    evidence_status: 'Derived',
    limitations: [
      'Competitive similarity reflects catalog taxonomy, pack size ratio, and declared active benefits.',
      'Does not incorporate confidential commercial sales volume or consumer cross-price elasticity estimates.',
      'Different packaging formats (e.g. Pump vs Tube) may influence perceived utility beyond net weight.'
    ]
  };
}

/**
 * Generate competitive sets for all products in a catalogue.
 */
export function buildAllCompetitiveSets(products: NormalizedProduct[]): Map<string, CompetitiveSet> {
  const map = new Map<string, CompetitiveSet>();
  products.forEach((p) => {
    map.set(p.product_id, buildCompetitiveSet(p, products));
  });
  return map;
}
