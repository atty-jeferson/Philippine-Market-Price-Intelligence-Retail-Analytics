import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Scale,
  Download,
  Info,
  ChevronUp,
  ChevronDown,
  Tag,
  Star,
  Check
} from 'lucide-react';
import { NormalizedProduct, SizeUnit } from '../../types';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, MarketContext } from '../common/DesignSystem';
import { exportProductsToCSV, downloadCSV } from '../../utils/csvHandler';

interface PriceExplorerTabProps {
  products: NormalizedProduct[];
  marketMedian100g: number;
  initialSearch?: string;
  onSelectProduct: (product: NormalizedProduct) => void;
  selectedForCompare: NormalizedProduct[];
  onToggleCompare: (product: NormalizedProduct) => void;
}

type SortField =
  | 'price_per_100g'
  | 'value_score'
  | 'price_php'
  | 'price_index'
  | 'rating'
  | 'discount_percent';

export const PriceExplorerTab: React.FC<PriceExplorerTabProps> = ({
  products,
  marketMedian100g,
  initialSearch = '',
  onSelectProduct,
  selectedForCompare,
  onToggleCompare
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filters
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('all');
  const [selectedSizeRange, setSelectedSizeRange] = useState<string>('all');
  const [selectedPromoOnly, setSelectedPromoOnly] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [maxPrice100g, setMaxPrice100g] = useState<number>(500);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('price_per_100g');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Derive unique filter options
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).sort(), [products]);
  const retailers = useMemo(() => Array.from(new Set(products.map((p) => p.retailer))).sort(), [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.product_name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.variant.toLowerCase().includes(q) ||
          p.retailer.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Brand
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;

      // Retailer
      if (selectedRetailer !== 'all' && p.retailer !== selectedRetailer) return false;

      // Tier
      if (selectedTier !== 'all' && p.premium_positioning !== selectedTier) return false;

      // Promo
      if (selectedPromoOnly && p.discount_percent <= 0 && !p.is_multipack) return false;

      // Max unit price
      if (p.price_per_100g > maxPrice100g) return false;

      // Size Range
      if (selectedSizeRange === 'small' && p.total_weight_grams > 100) return false;
      if (selectedSizeRange === 'medium' && (p.total_weight_grams <= 100 || p.total_weight_grams > 150)) return false;
      if (selectedSizeRange === 'large' && p.total_weight_grams <= 150) return false;
      if (selectedSizeRange === 'multipack' && !p.is_multipack) return false;

      // Feature
      if (selectedFeature === 'whitening' && !p.whitening) return false;
      if (selectedFeature === 'sensitivity' && !p.sensitivity) return false;
      if (selectedFeature === 'gum_care' && !p.gum_care) return false;
      if (selectedFeature === 'charcoal' && !p.charcoal) return false;
      if (selectedFeature === 'herbal' && !p.herbal) return false;
      if (selectedFeature === 'kids' && !p.kids) return false;

      return true;
    });
  }, [
    products,
    searchQuery,
    selectedBrand,
    selectedRetailer,
    selectedTier,
    selectedPromoOnly,
    maxPrice100g,
    selectedSizeRange,
    selectedFeature
  ]);

  // Sorted list
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let valA = a[sortField] || 0;
      let valB = b[sortField] || 0;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'price_per_100g' || field === 'price_php');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedRetailer('all');
    setSelectedSizeRange('all');
    setSelectedPromoOnly(false);
    setSelectedFeature('all');
    setSelectedTier('all');
    setMaxPrice100g(500);
  };

  const handleExportCSV = () => {
    const csv = exportProductsToCSV(sortedProducts);
    downloadCSV('grocer_ph_filtered_skus.csv', csv);
  };

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Price Explorer"
        subtitle="Granular database of audited Philippine supermarket products with normalized unit economics (₱/100g), promo flags, and benchmark indices."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans text-[#737A74] hidden sm:inline">
              <span className="font-data tabular-nums font-bold text-[#163829]">{filteredProducts.length}</span> of <span className="font-data tabular-nums">{products.length}</span> SKUs
            </span>
            <EvidenceBadge status="Observed" size="md" />
          </div>
        }
      />

      {/* 2. EDUCATIONAL BANNER */}
      <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl text-xs text-[#4F5751] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#176B4D] shrink-0 mt-0.5" />
          <p className="leading-relaxed font-normal text-[#4F5751]">
            <strong className="text-[#163829] font-semibold">The Unit Price Rule:</strong> A ₱200 shelf price is not necessarily more expensive than a ₱150 package.
            Always evaluate <strong className="text-[#176B4D] font-semibold">Price per 100g</strong> to accurately normalize divergent package sizes (40g to 300g).
          </p>
        </div>
        <LearnTooltip topicKey="unit_price" label="Learn More" />
      </div>

      {/* 3. MAIN FILTER & SEARCH BAR */}
      <div className="bg-white p-5 rounded-xl border border-[#E3E6DF] shadow-card space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737A74]" />
            <input
              id="explorer-search-input"
              type="text"
              placeholder="Search toothpaste, brand, or variant (e.g., 'Total', 'Rapid Relief', '150g')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs sm:text-sm text-[#163829] placeholder-[#737A74] focus:outline-none focus:border-[#176B4D] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737A74] hover:text-[#163829] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher & Export */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center bg-[#FAFAF7] p-1 rounded-lg border border-[#E3E6DF] text-xs">
              <button
                type="button"
                id="view-table-btn"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#163829] text-white font-semibold' : 'text-[#737A74] hover:text-[#163829]'
                }`}
                title="Table view"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                id="view-cards-btn"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-[#163829] text-white font-semibold' : 'text-[#737A74] hover:text-[#163829]'
                }`}
                title="Card view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            <button
              id="export-filtered-csv-btn"
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs text-[#163829] bg-[#FAFAF7] hover:bg-white border border-[#E3E6DF] px-3.5 py-2 rounded-lg transition-colors font-semibold cursor-pointer shadow-2xs"
              title="Download filtered CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#176B4D]" />
              <span>Export ({sortedProducts.length})</span>
            </button>
          </div>
        </div>

        {/* Multi-faceted Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-[#EEF0EA] text-xs font-sans">
          {/* Brand Filter */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#737A74] mb-1">Brand</label>
            <select
              id="filter-brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Retailer Filter */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#737A74] mb-1">Retailer</label>
            <select
              id="filter-retailer"
              value={selectedRetailer}
              onChange={(e) => setSelectedRetailer(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Retailers ({retailers.length})</option>
              {retailers.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Sizing & Packaging */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#737A74] mb-1">Package Sizing</label>
            <select
              id="filter-size"
              value={selectedSizeRange}
              onChange={(e) => setSelectedSizeRange(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Sizes</option>
              <option value="small">Small (&le; 100g)</option>
              <option value="medium">Standard (101g &ndash; 150g)</option>
              <option value="large">Large (&gt; 150g)</option>
              <option value="multipack">Twin / Multi-Packs Only</option>
            </select>
          </div>

          {/* Attribute Feature */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#737A74] mb-1">Formulation</label>
            <select
              id="filter-feature"
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Formulations</option>
              <option value="whitening">Whitening</option>
              <option value="sensitivity">Sensitivity Relief</option>
              <option value="gum_care">Gum Care</option>
              <option value="charcoal">Charcoal Active</option>
              <option value="herbal">Herbal / Botanical</option>
              <option value="kids">Kids Gentle</option>
            </select>
          </div>

          {/* Positioning Tier */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#737A74] mb-1">Positioning Tier</label>
            <select
              id="filter-tier"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-[#163829] focus:outline-none focus:border-[#176B4D]"
            >
              <option value="all">All Tiers</option>
              <option value="Budget">Budget</option>
              <option value="Mainstream">Mainstream</option>
              <option value="Premium">Premium</option>
              <option value="Specialty">Specialty</option>
            </select>
          </div>

          {/* Promo Filter Toggle */}
          <div className="flex flex-col justify-end">
            <button
              id="filter-promo-toggle"
              type="button"
              onClick={() => setSelectedPromoOnly(!selectedPromoOnly)}
              className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                selectedPromoOnly
                  ? 'bg-[#FFFDF5] border-[#FEEBB5] text-[#B8860B]'
                  : 'bg-[#FAFAF7] border-[#E3E6DF] text-[#4F5751] hover:bg-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Promos Only</span>
            </button>
          </div>
        </div>

        {/* Active Filter Bar & Reset */}
        <div className="flex items-center justify-between text-xs text-[#737A74] pt-1 font-sans">
          <div>
            Showing <strong className="text-[#163829] font-data tabular-nums">{sortedProducts.length}</strong> observed SKUs
          </div>
          {(selectedBrand !== 'all' || selectedRetailer !== 'all' || selectedTier !== 'all' || selectedPromoOnly || selectedFeature !== 'all' || selectedSizeRange !== 'all' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-[#176B4D] hover:underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* 4. CONTENT VIEW: TABLE OR CARDS */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-[#E3E6DF] overflow-hidden shadow-card">
          <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 shadow-2xs">
                <tr className="bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#737A74] font-sans uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 text-center w-10 bg-[#FAFAF7]">Comp</th>
                  <th className="py-2.5 px-3.5 font-semibold bg-[#FAFAF7]">SKU / Product Line</th>
                  <th className="py-2.5 px-3 font-semibold bg-[#FAFAF7]">Size</th>
                  <th
                    className="py-2.5 px-3.5 text-right font-semibold cursor-pointer hover:text-[#163829] bg-[#FAFAF7]"
                    onClick={() => handleSort('price_php')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Shelf Price</span>
                      {sortField === 'price_php' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3.5 text-right bg-[#EEF4EE] text-[#176B4D] font-bold cursor-pointer hover:bg-[#DDEBE1] transition-colors border-l border-r border-[#DDEBE1]"
                    onClick={() => handleSort('price_per_100g')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Price / 100g</span>
                      <LearnTooltip topicKey="unit_price" iconOnly />
                      {sortField === 'price_per_100g' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3.5 text-right font-semibold cursor-pointer hover:text-[#163829] bg-[#FAFAF7]"
                    onClick={() => handleSort('price_index')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Price Index</span>
                      <LearnTooltip topicKey="price_index" iconOnly />
                      {sortField === 'price_index' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3.5 text-right font-semibold cursor-pointer hover:text-[#163829] bg-[#FAFAF7]"
                    onClick={() => handleSort('value_score')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Value Score</span>
                      <LearnTooltip topicKey="value_score" iconOnly />
                      {sortField === 'value_score' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                    </div>
                  </th>
                  <th className="py-2.5 px-3.5 font-semibold bg-[#FAFAF7]">Retailer</th>
                  <th className="py-2.5 px-3.5 text-center font-semibold bg-[#FAFAF7]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0EA] font-sans">
                {sortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-[#737A74]">
                      No products match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((p) => {
                    const isSelected = selectedForCompare.some((c) => c.product_id === p.product_id);
                    const isBelowMedian = p.relative_percent_vs_median < 0;

                    return (
                      <tr
                        key={p.product_id}
                        className={`hover:bg-[#FAFAF7]/90 transition-colors ${
                          isSelected ? 'bg-[#EEF4EE]/70' : ''
                        }`}
                      >
                        {/* Compare Checkbox */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleCompare(p)}
                            title="Add to product comparison"
                            className="w-4 h-4 rounded border-[#E3E6DF] bg-white text-[#176B4D] focus:ring-[#176B4D] cursor-pointer accent-[#176B4D]"
                          />
                        </td>

                        {/* Product & Brand */}
                        <td
                          className="py-2.5 px-3.5 cursor-pointer max-w-xs"
                          onClick={() => onSelectProduct(p)}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#FAFAF7] text-[#163829] border border-[#E3E6DF]">
                              {p.brand}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FAFAF7] text-[#737A74] border border-[#E3E6DF]">
                              {p.premium_positioning}
                            </span>
                            {p.discount_percent > 0 && (
                              <span className="text-[10px] font-data font-bold px-1.5 py-0.2 rounded bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5]">
                                -{p.discount_percent}%
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-[#163829] hover:text-[#176B4D] transition-colors truncate text-xs">
                            {p.product_name}
                          </div>
                          <div className="text-[11px] text-[#737A74] truncate">{p.variant}</div>
                        </td>

                        {/* Size / Net Wt. */}
                        <td className="py-2.5 px-3">
                          <div className="font-data tabular-nums text-[#163829] font-medium">
                            {p.size_value}
                            {p.size_unit}
                          </div>
                          {p.is_multipack ? (
                            <span className="text-[10px] font-medium text-[#B45309] bg-[#FFFDF5] border border-[#FEEBB5] px-1.5 py-0.2 rounded">
                              Twin ({p.total_weight_grams}g)
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#737A74]">Single</span>
                          )}
                        </td>

                        {/* Observed Shelf Price */}
                        <td className="py-2.5 px-3.5 text-right font-data tabular-nums">
                          <div className="font-bold text-[#163829]">₱{p.price_php.toFixed(2)}</div>
                          {p.regular_price_php > p.price_php && (
                            <div className="text-[10px] text-[#737A74] line-through">
                              ₱{p.regular_price_php.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Price per 100g */}
                        <td className="py-2.5 px-3.5 text-right bg-[#EEF4EE]/50 font-data tabular-nums border-l border-r border-[#DDEBE1]/60">
                          <div className="font-bold text-[#176B4D] text-sm">
                            ₱{p.price_per_100g.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-[#737A74]">₱{p.price_per_gram.toFixed(3)}/g</div>
                        </td>

                        {/* Price Index with inline micro-bar relative to 100 */}
                        <td className="py-2.5 px-3.5 text-right font-data tabular-nums">
                          <div className="font-bold text-[#163829]">{p.price_index}</div>
                          <div
                            className={`text-[10px] font-sans font-medium ${
                              isBelowMedian ? 'text-[#176B4D]' : 'text-[#B45309]'
                            }`}
                          >
                            {Math.abs(p.relative_percent_vs_median)}% {isBelowMedian ? 'below' : 'above'}
                          </div>
                          {/* Mini dispersion bar vs 100 */}
                          <div className="w-16 h-1 bg-[#E3E6DF] rounded-full overflow-hidden relative mt-1 ml-auto">
                            <div className="absolute top-0 bottom-0 w-0.5 bg-[#737A74] left-1/2 -translate-x-1/2 z-10" />
                            <div
                              className={`absolute top-0 bottom-0 rounded-full ${
                                isBelowMedian ? 'bg-[#176B4D] right-1/2' : 'bg-[#D97706] left-1/2'
                              }`}
                              style={{
                                width: `${Math.min(50, Math.abs(p.relative_percent_vs_median) * 0.6)}%`
                              }}
                            />
                          </div>
                        </td>

                        {/* Value Score */}
                        <td className="py-2.5 px-3.5 text-right font-data tabular-nums">
                          <span
                            className={`inline-block font-bold px-2 py-0.5 rounded text-xs ${
                              p.value_score >= 80
                                ? 'bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1]'
                                : p.value_score >= 65
                                ? 'bg-[#FAFAF7] text-[#163829] border border-[#E3E6DF]'
                                : 'bg-[#FAFAF7] text-[#737A74] border border-[#E3E6DF]'
                            }`}
                          >
                            {p.value_score}/100
                          </span>
                        </td>

                        {/* Retailer */}
                        <td className="py-2.5 px-3.5">
                          <div className="font-semibold text-[#163829]">{p.retailer}</div>
                          <div className="text-[10px] text-[#737A74]">{p.retailer_type}</div>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => onSelectProduct(p)}
                            className="text-[11px] font-semibold text-[#176B4D] hover:underline cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {sortedProducts.map((p) => {
            const isSelected = selectedForCompare.some((c) => c.product_id === p.product_id);
            return (
              <div
                key={p.product_id}
                className={`bg-white border rounded-xl p-5 transition-all flex flex-col justify-between shadow-card hover:shadow-card-hover ${
                  isSelected ? 'border-[#176B4D] ring-1 ring-[#176B4D] bg-[#EEF4EE]/30' : 'border-[#E3E6DF] hover:border-[#176B4D]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-[#FAFAF7] text-[#163829] border border-[#E3E6DF]">
                        {p.brand}
                      </span>
                      {p.is_multipack && (
                        <span className="text-[10px] font-medium bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5] px-1.5 py-0.2 rounded">
                          Twin Pack
                        </span>
                      )}
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-[#737A74] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleCompare(p)}
                        className="rounded border-[#E3E6DF] bg-white text-[#176B4D] focus:ring-[#176B4D] accent-[#176B4D]"
                      />
                      <span>Compare</span>
                    </label>
                  </div>

                  <h4
                    onClick={() => onSelectProduct(p)}
                    className="font-bold text-[#163829] text-sm hover:text-[#176B4D] cursor-pointer line-clamp-2 leading-snug"
                  >
                    {p.product_name}
                  </h4>
                  <p className="text-xs text-[#737A74] mt-0.5">
                    {p.variant} &bull; {p.size_value}
                    {p.size_unit} ({p.retailer})
                  </p>

                  <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[10px]">
                    {p.whitening && <span className="px-1.5 py-0.5 bg-[#FAFAF7] text-[#737A74] rounded border border-[#E3E6DF]">Whitening</span>}
                    {p.sensitivity && <span className="px-1.5 py-0.5 bg-[#EEF4EE] text-[#176B4D] rounded border border-[#DDEBE1]">Sensitive</span>}
                    {p.gum_care && <span className="px-1.5 py-0.5 bg-[#FAFAF7] text-[#737A74] rounded border border-[#E3E6DF]">Gum Care</span>}
                  </div>
                </div>

                <div className="pt-3.5 mt-3.5 border-t border-[#EEF0EA] flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#737A74]">Shelf Price</div>
                    <div className="text-base font-data tabular-nums font-bold text-[#163829]">₱{p.price_php.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-[#176B4D] font-bold">Unit Cost</div>
                    <div className="text-base font-data tabular-nums font-bold text-[#176B4D]">₱{p.price_per_100g.toFixed(2)}/100g</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
