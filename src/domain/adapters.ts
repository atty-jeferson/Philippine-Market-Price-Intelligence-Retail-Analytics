/**
 * THE GROCER - Domain Adapters & Transformation Layer
 * 
 * Provides bidirectional mapping between the new category-agnostic Domain Model
 * and the legacy flat ProductData representation.
 * 
 * Guarantees zero regression for existing calculations, tabs, and CSV workflows
 * while separating physical SKU formulations from temporal price observations.
 */

import {
  DomainDataset,
  MarketScope,
  Brand,
  Product,
  SKU,
  Retailer,
  StoreOutlet,
  PriceObservation,
  Promotion,
  DataSource,
  EvidenceStatus,
  ChannelType
} from './types';
import { ProductData, HistoricalPricePoint } from '../types';
import { TOOTHPASTE_CATEGORY_CONFIG, CategoryConfig } from './categoryConfig';

/**
 * Normalizes a string into a clean alphanumeric slug
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Builds a deterministic canonical SKU identifier from physical characteristics
 */
export function buildCanonicalSKUId(
  brand: string,
  productName: string,
  variant: string,
  sizeValue: number,
  sizeUnit: string,
  multipackCount: number = 1
): string {
  const brandSlug = toSlug(brand);
  const nameSlug = toSlug(productName);
  const variantSlug = toSlug(variant);
  const packSuffix = multipackCount > 1 ? `-${multipackCount}pk` : '';
  return `sku-${brandSlug}-${nameSlug}-${variantSlug}-${sizeValue}${sizeUnit}${packSuffix}`;
}

/**
 * Converts a legacy flat ProductData array into the category-agnostic DomainDataset
 */
export function productDataToDomain(
  products: ProductData[],
  categoryConfig: CategoryConfig = TOOTHPASTE_CATEGORY_CONFIG,
  customScope?: Partial<MarketScope>
): DomainDataset {
  const scope: MarketScope = {
    ...categoryConfig.default_scope,
    ...customScope
  };

  const brands = new Map<string, Brand>();
  const productEntities = new Map<string, Product>();
  const productKeyToId = new Map<string, string>();
  const skus = new Map<string, SKU>();
  const retailers = new Map<string, Retailer>();
  const stores = new Map<string, StoreOutlet>();
  const promotions = new Map<string, Promotion>();
  const dataSources = new Map<string, DataSource>();
  const observations: PriceObservation[] = [];

  products.forEach((p, idx) => {
    // 1. Extract or register Brand
    const brandId = toSlug(p.brand);
    if (!brands.has(brandId)) {
      brands.set(brandId, {
        brand_id: brandId,
        brand_name: p.brand,
        origin: p.origin,
        default_tier: p.premium_positioning
      });
    }

    // 2. Extract or register Canonical Product Formulation
    const productKey = `${brandId}:::${toSlug(p.product_name)}:::${toSlug(p.variant)}`;
    let canonicalProductId = productKeyToId.get(productKey);
    let canonicalProduct: Product;
    if (!canonicalProductId) {
      canonicalProductId = `prod-${brandId}-${toSlug(p.product_name)}-${toSlug(p.variant)}`;
      canonicalProduct = {
        product_id: canonicalProductId,
        brand_id: brandId,
        product_name: p.product_name,
        variant: p.variant,
        category_id: categoryConfig.category_id,
        sub_category: p.sub_category
      };
      productKeyToId.set(productKey, canonicalProductId);
      productEntities.set(canonicalProductId, canonicalProduct);
    } else {
      canonicalProduct = productEntities.get(canonicalProductId)!;
    }

    // 3. Extract or register Physical Packaged SKU
    const skuId = buildCanonicalSKUId(
      p.brand,
      p.product_name,
      p.variant,
      p.size_value,
      p.size_unit,
      p.multipack_count
    );

    if (!skus.has(skuId)) {
      // Dynamic extraction of category attributes based on categoryConfig
      const skuAttributes: Record<string, boolean | string | number> = {};
      categoryConfig.attributes.forEach((attrDef) => {
        const rawVal = (p as unknown as Record<string, unknown>)[attrDef.key];
        if (rawVal !== undefined) {
          skuAttributes[attrDef.key] = rawVal as boolean | string | number;
        }
      });

      skus.set(skuId, {
        sku_id: skuId,
        product_id: canonicalProduct.product_id,
        barcode_ean: undefined, // Available for enterprise GTIN expansion
        net_content: p.weight_grams || p.size_value,
        unit_of_measure: p.size_unit,
        multipack_units: p.multipack_count || 1,
        is_multipack: p.is_multipack || false,
        package_type: 'Tube',
        attributes: skuAttributes
      });
    }

    // 4. Extract or register Retailer
    const retailerId = toSlug(p.retailer);
    if (!retailers.has(retailerId)) {
      retailers.set(retailerId, {
        retailer_id: retailerId,
        retailer_name: p.retailer,
        channel_type: p.retailer_type as ChannelType,
        region_scope: 'Philippines'
      });
    }

    // 5. Extract or register Store Outlet
    const storeId = `store-${retailerId}-${toSlug(p.location)}`;
    if (!stores.has(storeId)) {
      stores.set(storeId, {
        store_id: storeId,
        retailer_id: retailerId,
        branch_name: `${p.retailer} - ${p.location}`,
        location: p.location,
        is_digital: p.retailer_type === 'E-Commerce Marketplace'
      });
    }

    // 6. Extract DataSource
    const sourceId = toSlug(p.source || 'default-audit');
    if (!dataSources.has(sourceId)) {
      dataSources.set(sourceId, {
        data_source_id: sourceId,
        source_name: p.source || 'Retail Store Audit',
        source_type: p.retailer_type === 'E-Commerce Marketplace' ? 'retailer_ecom_scrape' : 'manual_shelf_audit',
        collected_at: p.date_collected || new Date().toISOString().split('T')[0],
        verification_status: p.is_demo ? 'provisional' : 'verified'
      });
    }

    // 7. Extract Promotion if on sale
    let promotionId: string | undefined = undefined;
    if (p.sale_price_php !== null && p.sale_price_php < p.regular_price_php) {
      promotionId = `promo-${retailerId}-${skuId}-${p.date_collected}`;
      if (!promotions.has(promotionId)) {
        promotions.set(promotionId, {
          promotion_id: promotionId,
          promotion_type: 'discount',
          discount_percent: p.discount_percent,
          discount_amount_php: p.regular_price_php - p.sale_price_php,
          promotion_mechanic: `${p.discount_percent}% off regular price`
        });
      }
    }

    // 8. Create Primary PriceObservation record
    const obsId = `obs-${p.product_id || idx}-${retailerId}-${p.date_collected}`;
    const primaryObservation: PriceObservation = {
      observation_id: obsId,
      sku_id: skuId,
      retailer_id: retailerId,
      store_id: storeId,
      observed_date: p.date_collected,
      shelf_price: p.price_php,
      regular_price: p.regular_price_php,
      currency: scope.currency,
      is_promotional: p.sale_price_php !== null && p.sale_price_php < p.regular_price_php,
      promotion_id: promotionId,
      data_source_id: sourceId,
      evidence_status: 'Observed',
      product_url: p.product_url,
      rating: p.rating,
      review_count: p.review_count
    };
    observations.push(primaryObservation);

    // 9. Unpack nested historical prices into separate PriceObservation records
    if (p.historical_prices && p.historical_prices.length > 0) {
      p.historical_prices.forEach((hist, hIdx) => {
        const histRetailerId = toSlug(hist.retailer || p.retailer);
        const histObsId = `obs-hist-${skuId}-${histRetailerId}-${hist.date}-${hIdx}`;
        const isHistPromo = hist.sale_price_php !== undefined && hist.sale_price_php !== null && hist.sale_price_php < (hist.regular_price_php || hist.price_php);
        
        let histPromoId: string | undefined = undefined;
        if (isHistPromo && hist.regular_price_php && hist.sale_price_php) {
          histPromoId = `promo-${histRetailerId}-${skuId}-${hist.date}`;
          if (!promotions.has(histPromoId)) {
            const discPct = Math.round(((hist.regular_price_php - hist.sale_price_php) / hist.regular_price_php) * 100);
            promotions.set(histPromoId, {
              promotion_id: histPromoId,
              promotion_type: 'discount',
              discount_percent: discPct,
              discount_amount_php: hist.regular_price_php - hist.sale_price_php
            });
          }
        }

        observations.push({
          observation_id: histObsId,
          sku_id: skuId,
          retailer_id: histRetailerId,
          store_id: storeId,
          observed_date: hist.date,
          shelf_price: hist.price_php,
          regular_price: hist.regular_price_php || hist.price_php,
          currency: scope.currency,
          is_promotional: isHistPromo,
          promotion_id: histPromoId,
          data_source_id: sourceId,
          evidence_status: 'Observed'
        });
      });
    }
  });

  return {
    scope,
    brands,
    products: productEntities,
    skus,
    retailers,
    stores,
    promotions,
    dataSources,
    observations
  };
}

/**
 * Reconstructs the legacy ProductData structure from the DomainDataset.
 * 
 * Ensures backward compatibility with existing analytical calculators,
 * Recharts modules, and table renderers without modifying downstream code.
 */
export function domainToProductData(
  dataset: DomainDataset,
  categoryConfig: CategoryConfig = TOOTHPASTE_CATEGORY_CONFIG
): ProductData[] {
  const result: ProductData[] = [];

  // Group observations by SKU and Retailer to rebuild current listing representations
  // with their associated historical timelines
  const listingMap = new Map<string, PriceObservation[]>();
  dataset.observations.forEach((obs) => {
    const key = `${obs.sku_id}:::${obs.retailer_id}`;
    if (!listingMap.has(key)) {
      listingMap.set(key, []);
    }
    listingMap.get(key)!.push(obs);
  });

  listingMap.forEach((obsList, listingKey) => {
    // Sort chronologically ascending
    obsList.sort((a, b) => new Date(a.observed_date).getTime() - new Date(b.observed_date).getTime());
    
    // The most recent observation represents current shelf price
    const latestObs = obsList[obsList.length - 1];
    const previousObsList = obsList.slice(0, obsList.length - 1);

    const sku = dataset.skus.get(latestObs.sku_id);
    if (!sku) return;

    const prod = dataset.products.get(sku.product_id);
    const brand = prod ? dataset.brands.get(prod.brand_id) : undefined;
    const retailer = dataset.retailers.get(latestObs.retailer_id);
    const store = latestObs.store_id ? dataset.stores.get(latestObs.store_id) : undefined;
    const promo = latestObs.promotion_id ? dataset.promotions.get(latestObs.promotion_id) : undefined;
    const source = dataset.dataSources.get(latestObs.data_source_id);

    // Reconstruct historical price points array for backward-compatible charts
    const historicalPrices: HistoricalPricePoint[] = previousObsList.map((h) => ({
      date: h.observed_date,
      price_php: h.shelf_price,
      regular_price_php: h.regular_price,
      sale_price_php: h.is_promotional ? h.shelf_price : null,
      retailer: retailer ? retailer.retailer_name : h.retailer_id
    }));

    // Build base attributes with defaults
    const attrs = sku.attributes || {};

    const legacyProduct: ProductData = {
      product_id: latestObs.observation_id.replace(/^obs-/, ''),
      brand: brand ? brand.brand_name : 'Unknown Brand',
      product_name: prod ? prod.product_name : 'Unknown Product',
      variant: prod ? prod.variant : 'Regular',
      category: dataset.scope.category,
      sub_category: prod?.sub_category || dataset.scope.sub_category,
      size_value: sku.net_content,
      size_unit: sku.unit_of_measure === 'ml' ? 'ml' : 'g',
      weight_grams: sku.unit_of_measure === 'g' ? sku.net_content : sku.net_content,
      volume_ml: sku.unit_of_measure === 'ml' ? sku.net_content : null,
      is_multipack: sku.is_multipack,
      multipack_count: sku.multipack_units,
      price_php: latestObs.shelf_price,
      regular_price_php: latestObs.regular_price,
      sale_price_php: latestObs.is_promotional ? latestObs.shelf_price : null,
      discount_percent: promo ? promo.discount_percent : 0,
      retailer: retailer ? retailer.retailer_name : 'Unknown Retailer',
      retailer_type: (retailer?.channel_type as any) || 'Supermarket / Hypermarket',
      location: store ? store.location : 'Philippines',
      date_collected: latestObs.observed_date,
      product_url: latestObs.product_url || '',
      rating: latestObs.rating,
      review_count: latestObs.review_count || 0,

      // Project category attributes (only true if actually specified)
      fluoride: attrs.fluoride !== undefined ? Boolean(attrs.fluoride) : false,
      whitening: attrs.whitening !== undefined ? Boolean(attrs.whitening) : false,
      sensitivity: attrs.sensitivity !== undefined ? Boolean(attrs.sensitivity) : false,
      anti_cavity: attrs.anti_cavity !== undefined ? Boolean(attrs.anti_cavity) : false,
      gum_care: attrs.gum_care !== undefined ? Boolean(attrs.gum_care) : false,
      herbal: attrs.herbal !== undefined ? Boolean(attrs.herbal) : false,
      charcoal: attrs.charcoal !== undefined ? Boolean(attrs.charcoal) : false,
      kids: attrs.kids !== undefined ? Boolean(attrs.kids) : false,

      premium_positioning: brand?.default_tier || 'Unknown',
      origin: brand?.origin || 'Unknown',
      source: source ? source.source_name : 'Retail Store Audit',
      is_demo: false,
      historical_prices: historicalPrices.length > 0 ? historicalPrices : undefined
    };

    result.push(legacyProduct);
  });

  return result;
}
