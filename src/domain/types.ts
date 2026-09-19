/**
 * THE GROCER - Category-Agnostic Domain Model
 * 
 * Defines core retail market intelligence domain entities decoupled from any specific FMCG category.
 * Toothpaste-specific attributes (fluoride, whitening, etc.) are strictly excluded from these entities
 * and handled via category configuration and generic SKU attribute dictionaries.
 */

export type EvidenceStatus = 'Observed' | 'Derived' | 'Estimated' | 'Inferred';

export type UnitOfMeasure = 'g' | 'ml' | 'kg' | 'l' | 'sachet' | 'piece' | 'pack';

export type UnitBasis = 'weight' | 'volume' | 'count';

export type ChannelType = 
  | 'Pharmacy / Health' 
  | 'Supermarket / Hypermarket' 
  | 'Convenience / Minimart'
  | 'E-Commerce Marketplace' 
  | 'Direct-to-Consumer'
  | 'Wholesale / Cash & Carry';

export type PositioningTier = 'Budget' | 'Mainstream' | 'Premium' | 'Specialty' | 'Unknown';

export type OriginType = 'Local' | 'Imported' | 'Unknown';

/**
 * MarketScope represents the analytical perimeter and taxonomy of the category under observation.
 */
export interface MarketScope {
  country: string;              // e.g. "Philippines"
  country_code: string;         // e.g. "PH"
  sector: string;               // e.g. "FMCG"
  category: string;             // e.g. "Oral Care"
  sub_category: string;         // e.g. "Toothpaste"
  category_id: string;          // e.g. "toothpaste", "shampoo", "laundry_detergent"
  currency: string;             // e.g. "PHP"
  currency_symbol: string;      // e.g. "₱"
  unit_basis: UnitBasis;        // 'weight' | 'volume' | 'count'
  standard_unit: UnitOfMeasure; // e.g. 'g', 'ml'
  standard_quantity: number;    // e.g. 100 (for 100g / 100ml basis)
}

/**
 * Brand represents the trademark or commercial brand entity.
 */
export interface Brand {
  brand_id: string;             // Canonical slug e.g. "colgate", "sensodyne", "hapee"
  brand_name: string;           // Display name e.g. "Colgate", "Sensodyne", "Hapee"
  manufacturer?: string;        // e.g. "Colgate-Palmolive", "Haleon", "Lamoiyan Corporation"
  origin?: OriginType;          // 'Local' | 'Imported'
  default_tier?: PositioningTier; // 'Budget' | 'Mainstream' | 'Premium' | 'Specialty'
  country_of_origin?: string;   // e.g. "Philippines", "United Kingdom", "Japan"
}

/**
 * Product represents the canonical consumer formulation / product line.
 */
export interface Product {
  product_id: string;           // Canonical product identifier
  brand_id: string;             // Reference to Brand
  product_name: string;         // Base product line name (e.g. "Total Clean Mint", "Complete Protection")
  variant: string;              // Formulation variant (e.g. "Whitening", "Fresh Stripe", "Cool Mint")
  category_id: string;          // Reference to Category (e.g. "toothpaste")
  sub_category?: string;        // Specific sub-segment
  description?: string;
}

/**
 * SKU represents the physical packaged stock keeping unit.
 * 
 * NOTE: Attributes are polymorphic (Record<string, ...>) and category-extensible.
 * No category-specific fields (fluoride, whitening, charcoal, etc.) exist in this interface.
 */
export interface SKU {
  sku_id: string;               // Canonical SKU identifier
  product_id: string;           // Reference to Master Product
  barcode_ean?: string;         // Global Trade Item Number (GTIN / EAN-13 / UPC)
  net_content: number;          // Numeric package size (e.g. 150, 100, 200)
  unit_of_measure: UnitOfMeasure; // 'g', 'ml', 'kg', etc.
  multipack_units: number;      // 1 for single tube/pack, 2 for twin pack, etc.
  is_multipack: boolean;
  package_type?: string;        // 'Tube', 'Pump', 'Bottle', 'Sachet', 'Box'
  attributes: Record<string, boolean | string | number>; // Category-extensible key-value attributes
}

/**
 * Retailer represents the retail banner or commercial selling organization.
 */
export interface Retailer {
  retailer_id: string;          // Canonical retailer slug (e.g. "mercury-drug", "sm-supermarket", "watsons")
  retailer_name: string;        // Display name (e.g. "Mercury Drug", "SM Supermarket", "Watsons")
  channel_type: ChannelType;    // 'Pharmacy / Health' | 'Supermarket / Hypermarket' | 'E-Commerce Marketplace'
  parent_company?: string;      // e.g. "SM Investments", "Mercury Group", "A.S. Watson Group"
  region_scope?: string;        // e.g. "Nationwide", "National Capital Region", "VisMin"
  website_url?: string;
}

/**
 * StoreOutlet represents an individual physical store branch or digital sales channel.
 */
export interface StoreOutlet {
  store_id: string;             // Unique store identifier
  retailer_id: string;          // Reference to Retailer
  branch_name: string;          // e.g. "SM Megamall Supermarket", "Watsons Online Store"
  location: string;             // Geographic territory e.g. "Metro Manila", "Luzon", "Nationwide Online"
  channel_classification?: string; // "Modern Trade Supermarket", "Health & Beauty Flagship", "Marketplace Mall"
  is_digital: boolean;
}

/**
 * Promotion captures promotional mechanics and discounts separately from base pricing.
 */
export interface Promotion {
  promotion_id: string;         // Unique promotion identifier
  promotion_type: 'discount' | 'bundle' | 'bogo' | 'temporary_price_reduction' | 'clearance' | 'loyalty' | string;
  discount_percent: number;     // e.g. 15 for 15% off
  discount_amount_php?: number; // e.g. 25 for ₱25 off
  promotion_mechanic?: string;  // e.g. "15% off regular price", "Buy 1 Take 1", "Bundle Savings"
  start_date?: string;          // ISO 8601 YYYY-MM-DD
  end_date?: string;            // ISO 8601 YYYY-MM-DD
}

/**
 * DataSource captures the provenance of a price observation.
 */
export interface DataSource {
  data_source_id: string;       // Unique source identifier
  source_name: string;          // e.g. "SM Online E-Store", "Mercury Drug Shelf Audit", "Manual Ingestion"
  source_type: 'manual_shelf_audit' | 'retailer_ecom_scrape' | 'receipt_panel' | 'syndicated_feed' | 'user_csv_upload' | string;
  source_url?: string;
  collected_at: string;         // ISO 8601 timestamp
  collector_id?: string;
  verification_status?: 'verified' | 'unverified' | 'provisional';
}

/**
 * PriceObservation represents ONE observed price point at ONE point in time.
 * 
 * Crucially, historical prices are NOT nested arrays inside SKUs; they are independent
 * PriceObservation records indexed chronologically.
 */
export interface PriceObservation {
  observation_id: string;       // Unique observation identifier
  sku_id: string;               // Reference to SKU
  retailer_id: string;          // Reference to Retailer
  store_id?: string;            // Reference to StoreOutlet
  observed_date: string;        // ISO 8601 YYYY-MM-DD
  shelf_price: number;          // Actual observed price charged to consumer (in currency)
  regular_price: number;        // Base / non-promotional price
  currency: string;             // e.g. "PHP"
  is_promotional: boolean;
  promotion_id?: string;        // Reference to Promotion if applicable
  data_source_id: string;       // Reference to DataSource
  evidence_status: EvidenceStatus; // 'Observed' | 'Derived' | 'Estimated' | 'Inferred'
  product_url?: string;         // Direct source URL if e-commerce
  rating?: number;              // Channel-specific customer review rating
  review_count?: number;        // Channel-specific customer review count
}

/**
 * DomainDataset aggregates all normalized category-agnostic entities for a given analytical scope.
 */
export interface DomainDataset {
  scope: MarketScope;
  brands: Map<string, Brand>;
  products: Map<string, Product>;
  skus: Map<string, SKU>;
  retailers: Map<string, Retailer>;
  stores: Map<string, StoreOutlet>;
  promotions: Map<string, Promotion>;
  dataSources: Map<string, DataSource>;
  observations: PriceObservation[];
}
