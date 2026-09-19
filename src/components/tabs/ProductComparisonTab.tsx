import React, { useState } from 'react';
import {
  Scale,
  X,
  Plus,
  Award,
  ArrowDownRight,
  Sparkles,
  Maximize2,
  Star,
  Tag,
  Check,
  Store,
  Info
} from 'lucide-react';
import { NormalizedProduct } from '../../types';
import { LearnTooltip } from '../common/LearnTooltip';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';

interface ProductComparisonTabProps {
  products: NormalizedProduct[];
  selectedProducts: NormalizedProduct[];
  onRemoveFromCompare: (product: NormalizedProduct) => void;
  onAddToCompare: (product: NormalizedProduct) => void;
  onClearCompare: () => void;
  onSelectProduct: (product: NormalizedProduct) => void;
}

export const ProductComparisonTab: React.FC<ProductComparisonTabProps> = ({
  products,
  selectedProducts,
  onRemoveFromCompare,
  onAddToCompare,
  onClearCompare,
  onSelectProduct
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Find leadership badges among selected items
  const lowestUnitPriceProduct =
    selectedProducts.length > 0
      ? [...selectedProducts].sort((a, b) => a.price_per_100g - b.price_per_100g)[0]
      : null;

  const highestValueScoreProduct =
    selectedProducts.length > 0
      ? [...selectedProducts].sort((a, b) => b.value_score - a.value_score)[0]
      : null;

  const largestSizeProduct =
    selectedProducts.length > 0
      ? [...selectedProducts].sort((a, b) => b.total_weight_grams - a.total_weight_grams)[0]
      : null;

  const highestRatedProduct =
    selectedProducts.length > 0
      ? [...selectedProducts].sort((a, b) => b.rating - a.rating)[0]
      : null;

  const biggestDiscountProduct =
    selectedProducts.length > 0
      ? [...selectedProducts].sort((a, b) => b.discount_percent - a.discount_percent)[0]
      : null;

  // Presets
  const applyPreset = (brandNames: string[]) => {
    onClearCompare();
    brandNames.forEach((brand) => {
      const match = products.find((p) => p.brand.toLowerCase() === brand.toLowerCase());
      if (match) onAddToCompare(match);
    });
  };

  const availableToAdd = products.filter(
    (p) => !selectedProducts.some((sp) => sp.product_id === p.product_id)
  );

  const filteredModalProducts = availableToAdd.filter(
    (p) =>
      p.product_name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(modalSearch.toLowerCase()) ||
      p.variant.toLowerCase().includes(modalSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Side-by-Side Product Comparison"
        subtitle="Evaluate 2 to 5 Philippine toothpaste products across normalized unit costs, value indices, and packaging specifications."
        actions={
          <div className="flex items-center gap-2 flex-wrap font-sans">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737A74]">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset(['Colgate', 'Closeup', 'Sensodyne', 'Hapee'])}
              className="text-xs bg-white hover:bg-[#FAFAF7] text-[#163829] font-semibold px-3 py-1.5 rounded-lg border border-[#E3E6DF] transition-all shadow-2xs cursor-pointer"
            >
              Big 4
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['Dentiste', 'Sensodyne', 'Oral-B'])}
              className="text-xs bg-white hover:bg-[#FAFAF7] text-[#163829] font-semibold px-3 py-1.5 rounded-lg border border-[#E3E6DF] transition-all shadow-2xs cursor-pointer"
            >
              Premium &amp; Specialty
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['Hapee', 'Fresh', 'Colgate'])}
              className="text-xs bg-white hover:bg-[#FAFAF7] text-[#163829] font-semibold px-3 py-1.5 rounded-lg border border-[#E3E6DF] transition-all shadow-2xs cursor-pointer"
            >
              Budget Leaders
            </button>
            <EvidenceBadge status="Observed" size="md" />
          </div>
        }
      />

      {/* 2. PRIMARY COMPARISON VIEW */}
      {selectedProducts.length === 0 ? (
        <div className="bg-white border border-[#E3E6DF] rounded-xl p-12 text-center space-y-4 shadow-card font-sans">
          <div className="w-14 h-14 mx-auto rounded-xl bg-[#EEF4EE] border border-[#DDEBE1] flex items-center justify-center text-[#176B4D]">
            <Scale className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-serif font-bold text-[#163829]">No Products Selected for Comparison</h3>
            <p className="text-xs text-[#737A74]">
              Select 2 to 5 products from the Price Explorer or choose a quick preset above to evaluate side-by-side unit economics.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => applyPreset(['Colgate', 'Sensodyne', 'Hapee', 'Closeup'])}
              className="bg-[#163829] hover:bg-[#176B4D] text-white text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              Load &ldquo;Big 4&rdquo; Philippine Comparison
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 font-sans">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-[#737A74]">
              Comparing <strong className="text-[#163829] font-data tabular-nums font-bold">{selectedProducts.length}</strong> products
              (Max 5)
            </div>

            <div className="flex items-center gap-2">
              {selectedProducts.length < 5 && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 text-xs bg-[#176B4D] hover:bg-[#13583E] text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClearCompare}
                className="text-xs text-[#737A74] hover:text-[#991B1B] font-semibold px-2 py-1 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Highlights Banner */}
          <div className="p-4 sm:p-5 bg-white border border-[#E3E6DF] rounded-xl space-y-3 shadow-card">
            <div className="text-[10px] font-bold text-[#176B4D] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#176B4D]" />
              <span>Comparative Leadership Highlights</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <div className="text-[10px] text-[#737A74] uppercase tracking-wider font-bold">Lowest Unit Price</div>
                <div className="font-bold text-[#163829] mt-0.5 truncate">
                  {lowestUnitPriceProduct?.brand} ({lowestUnitPriceProduct?.variant})
                </div>
                <div className="text-[11px] font-data tabular-nums font-bold text-[#176B4D] mt-0.5">
                  ₱{lowestUnitPriceProduct?.price_per_100g !== undefined ? lowestUnitPriceProduct.price_per_100g.toFixed(2) : '0.00'}/100g
                </div>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <div className="text-[10px] text-[#737A74] uppercase tracking-wider font-bold">Best Value Score</div>
                <div className="font-bold text-[#163829] mt-0.5 truncate">
                  {highestValueScoreProduct?.brand} ({highestValueScoreProduct?.variant})
                </div>
                <div className="text-[11px] font-data tabular-nums font-bold text-[#176B4D] mt-0.5">
                  {highestValueScoreProduct?.value_score ?? '—'}/100 Score
                </div>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <div className="text-[10px] text-[#737A74] uppercase tracking-wider font-bold">Highest Rated</div>
                <div className="font-bold text-[#163829] mt-0.5 truncate">
                  {highestRatedProduct?.brand} ({highestRatedProduct?.variant})
                </div>
                <div className="text-[11px] font-bold text-[#163829] mt-0.5">
                  <span className="font-data">{highestRatedProduct?.rating !== undefined ? `${highestRatedProduct.rating.toFixed(1)} ★` : '—'}</span> (<span className="font-data font-normal text-[#737A74]">{highestRatedProduct?.review_count ?? 0}</span>)
                </div>
              </div>

              <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
                <div className="text-[10px] text-[#737A74] uppercase tracking-wider font-bold">Largest Package</div>
                <div className="font-bold text-[#163829] mt-0.5 truncate">
                  {largestSizeProduct?.brand}
                </div>
                <div className="text-[11px] font-data tabular-nums font-bold text-[#163829] mt-0.5">
                  {largestSizeProduct?.total_weight_grams}g net content
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix Table */}
          <div className="bg-white rounded-xl border border-[#E3E6DF] overflow-x-auto shadow-card">
            <table className="w-full text-xs text-left min-w-[700px] border-collapse">
              <thead className="bg-[#FAFAF7] border-b border-[#E3E6DF]">
                <tr>
                  <th className="py-3.5 px-4 w-44 font-semibold text-[#737A74] uppercase tracking-wider text-[10px]">
                    Attribute / Metric
                  </th>
                  {selectedProducts.map((prod) => (
                    <th key={prod.product_id} className="py-3.5 px-4 min-w-[200px] align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-[#E3E6DF] text-[#163829] mb-1">
                            {prod.brand}
                          </span>
                          <h4
                            onClick={() => onSelectProduct(prod)}
                            className="font-bold text-[#163829] text-xs hover:text-[#176B4D] cursor-pointer line-clamp-2 leading-snug"
                          >
                            {prod.product_name}
                          </h4>
                          <span className="text-[11px] text-[#737A74] font-normal">
                            {prod.variant}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveFromCompare(prod)}
                          className="text-[#737A74] hover:text-[#991B1B] p-1 cursor-pointer"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0EA] text-[#163829]">
                {/* Row: Standard Unit Price */}
                <tr className="bg-[#EEF4EE]/60">
                  <td className="py-3 px-4 font-bold text-[#176B4D] flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider">PRICE / 100G</span>
                    <LearnTooltip topicKey="unit_price" iconOnly />
                  </td>
                  {selectedProducts.map((p) => {
                    const isLowest = lowestUnitPriceProduct?.product_id === p.product_id;
                    return (
                      <td key={p.product_id} className="py-3 px-4">
                        <div className="text-base font-data tabular-nums font-bold text-[#176B4D]">
                          ₱{p.price_per_100g.toFixed(2)}
                        </div>
                        {isLowest && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] px-1.5 py-0.5 rounded-md mt-1">
                            <Check className="w-3 h-3" />
                            Lowest Unit Price
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Row: Value Score */}
                <tr>
                  <td className="py-3 px-4 font-medium text-[#737A74] flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider">VALUE SCORE</span>
                    <LearnTooltip topicKey="value_score" iconOnly />
                  </td>
                  {selectedProducts.map((p) => {
                    const isBest = highestValueScoreProduct?.product_id === p.product_id;
                    return (
                      <td key={p.product_id} className="py-3 px-4">
                        <div className="text-sm font-data tabular-nums font-bold text-[#163829]">
                          {p.value_score} <span className="text-xs text-[#737A74] font-normal font-sans">/100</span>
                        </div>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FAFAF7] text-[#176B4D] border border-[#E3E6DF] px-1.5 py-0.5 rounded-md mt-1">
                            <Sparkles className="w-3 h-3" />
                            Best Value
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Row: Shelf Price */}
                <tr>
                  <td className="py-3 px-4 font-medium text-[#737A74]">Observed Shelf Price</td>
                  {selectedProducts.map((p) => (
                    <td key={p.product_id} className="py-3 px-4">
                      <div className="font-data tabular-nums font-bold text-[#163829]">₱{p.price_php.toFixed(2)}</div>
                      {p.discount_percent > 0 && p.regular_price_php != null && (
                        <div className="text-[10px] text-[#B45309]">
                          <span className="font-data">-{p.discount_percent}%</span> off regular <span className="font-data">₱{p.regular_price_php.toFixed(2)}</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row: Net Content / Size */}
                <tr>
                  <td className="py-3 px-4 font-medium text-[#737A74]">Size &amp; Net Weight</td>
                  {selectedProducts.map((p) => (
                    <td key={p.product_id} className="py-3 px-4">
                      <div className="font-medium text-[#163829]">
                        <span className="font-data">{p.size_value}</span>{p.size_unit} (<span className="font-data">{p.total_weight_grams}g</span> net)
                      </div>
                      {p.is_multipack && (
                        <div className="text-[10px] text-[#176B4D] font-bold mt-0.5">Twin / Bundle Pack</div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row: Price Index vs Median */}
                <tr>
                  <td className="py-3 px-4 font-medium text-[#737A74] flex items-center justify-between">
                    <span>Market Price Index</span>
                    <LearnTooltip topicKey="price_index" iconOnly />
                  </td>
                  {selectedProducts.map((p) => (
                    <td key={p.product_id} className="py-3 px-4">
                      <div className="font-data tabular-nums font-bold text-[#163829]">{p.price_index}</div>
                      <div
                        className={`text-[10px] font-sans ${
                          p.relative_percent_vs_median < 0 ? 'text-[#176B4D]' : 'text-[#B45309]'
                        }`}
                      >
                        <span className="font-data">{Math.abs(p.relative_percent_vs_median)}%</span>{' '}
                        {p.relative_percent_vs_median < 0 ? 'below median' : 'above median'}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Row: Consumer Rating */}
                <tr>
                  <td className="py-3 px-4 font-medium text-[#737A74]">Rating &amp; Reviews</td>
                  {selectedProducts.map((p) => (
                    <td key={p.product_id} className="py-3 px-4">
                      <div className="font-medium text-[#163829] flex items-center gap-1">
                        <span className="font-data tabular-nums font-bold">{p.rating.toFixed(1)}</span>
                        <Star className="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]" />
                        <span className="text-[#737A74] font-normal text-[11px]">(<span className="font-data">{p.review_count}</span>)</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Row: Retailer & Channel */}
                <tr>
                  <td className="py-3 px-4 font-medium text-[#737A74]">Retailer Source</td>
                  {selectedProducts.map((p) => (
                    <td key={p.product_id} className="py-3 px-4">
                      <div className="font-medium text-[#163829]">{p.retailer}</div>
                      <div className="text-[10px] text-[#737A74]">{p.retailer_type}</div>
                    </td>
                  ))}
                </tr>

                {/* Row: Positioning Tier */}
                <tr>
                  <td className="py-3 px-4 font-medium text-[#737A74]">Positioning Tier</td>
                  {selectedProducts.map((p) => (
                    <td key={p.product_id} className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAFAF7] border border-[#E3E6DF] text-[#4F5751] text-[10px] font-semibold">
                        {p.premium_positioning}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Row: Key Clinical Actives */}
                <tr>
                  <td className="py-3 px-4 font-medium text-[#737A74]">Formulation Features</td>
                  {selectedProducts.map((p) => (
                    <td key={p.product_id} className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {p.fluoride && <span className="px-1.5 py-0.5 bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] rounded-md font-semibold">Fluoride</span>}
                        {p.whitening && <span className="px-1.5 py-0.5 bg-[#FAFAF7] text-[#737A74] border border-[#E3E6DF] rounded-md">Whitening</span>}
                        {p.sensitivity && <span className="px-1.5 py-0.5 bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] rounded-md font-semibold">Sensitive</span>}
                        {p.gum_care && <span className="px-1.5 py-0.5 bg-[#FAFAF7] text-[#737A74] border border-[#E3E6DF] rounded-md">Gum Care</span>}
                        {p.charcoal && <span className="px-1.5 py-0.5 bg-[#FAFAF7] text-[#737A74] border border-[#E3E6DF] rounded-md">Charcoal</span>}
                        {p.herbal && <span className="px-1.5 py-0.5 bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] rounded-md">Herbal</span>}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E3E6DF] w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] text-[#163829]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E6DF] bg-[#FAFAF7]">
              <h3 className="font-bold text-[#163829] text-sm uppercase tracking-wider">
                Select Product to Compare
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#737A74] hover:text-[#163829] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 border-b border-[#E3E6DF]">
              <input
                type="text"
                placeholder="Search products by brand, name, variant..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAFAF7] border border-[#E3E6DF] rounded-lg text-xs text-[#163829] placeholder-[#737A74] focus:outline-none focus:border-[#176B4D]"
              />
            </div>
            <div className="p-2 overflow-y-auto space-y-1">
              {filteredModalProducts.map((p) => (
                <div
                  key={p.product_id}
                  onClick={() => {
                    onAddToCompare(p);
                    setShowAddModal(false);
                  }}
                  className="p-3 hover:bg-[#FAFAF7] rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors border border-transparent hover:border-[#E3E6DF]"
                >
                  <div>
                    <div className="font-bold text-[#163829]">
                      <span className="text-[#176B4D]">{p.brand}</span> - {p.product_name}
                    </div>
                    <div className="text-[#737A74] text-[11px] mt-0.5">
                      {p.variant} &bull; <span className="font-data">{p.size_value}{p.size_unit}</span> ({p.retailer})
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-[#176B4D] font-data tabular-nums">₱{p.price_per_100g.toFixed(2)}/100g</div>
                    <div className="text-[10px] text-[#737A74] font-data tabular-nums">₱{p.price_php.toFixed(2)} shelf</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
