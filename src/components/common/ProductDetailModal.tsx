import React from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Store,
  Calendar,
  Layers,
  Scale,
  Award
} from 'lucide-react';
import { NormalizedProduct } from '../../types';
import { LearnTooltip } from './LearnTooltip';

interface ProductDetailModalProps {
  product: NormalizedProduct | null;
  onClose: () => void;
  allProducts: NormalizedProduct[];
  onSelectCompare?: (product: NormalizedProduct) => void;
  onAddToCompare?: (product: NormalizedProduct) => void;
  marketMedian100g?: number;
  isCompared?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  allProducts,
  onSelectCompare,
  onAddToCompare,
  marketMedian100g,
  isCompared
}) => {
  if (!product) return null;

  const handleCompare = onAddToCompare || onSelectCompare;

  // Find identical SKU across other retailers
  const canonicalKey = `${product.brand.toLowerCase()}:::${product.variant.toLowerCase()}:::${product.size_value}${product.size_unit}`;
  const retailerSiblings = allProducts.filter((p) => {
    const key = `${p.brand.toLowerCase()}:::${p.variant.toLowerCase()}:::${p.size_value}${p.size_unit}`;
    return key === canonicalKey;
  });

  const isBelowMedian = product.relative_percent_vs_median < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div
        id="product-detail-modal"
        className="bg-white rounded-xl shadow-2xl border border-[#E8E9EC] w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#111318]"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E8E9EC] bg-[#F8F9FB]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-md bg-[#F0FDF4] text-[#0F5132] border border-[#DCFCE7]">
                {product.brand}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-[#E8E9EC] text-[#6B7280] font-medium">
                {product.category}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F8F9FB] border border-[#E8E9EC] text-[#111318] font-medium">
                {product.premium_positioning} Tier
              </span>
              {product.is_multipack && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] font-medium">
                  Twin / Multi-Pack ({product.multipack_count}x)
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-[#111318] leading-snug">
              {product.product_name}
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Variant: <span className="text-[#111318] font-medium">{product.variant}</span> • Net Content:{' '}
              <span className="text-[#111318] font-medium font-data">
                {product.size_value}
                {product.size_unit}
                {product.is_multipack ? ` (${product.total_weight_grams}g total net weight)` : ''}
              </span>
            </p>
          </div>
          <button
            id="close-product-detail"
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111318] p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Pricing Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl">
              <div className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-1">
                Observed Price
              </div>
              <div className="text-xl font-data tabular-nums font-bold text-[#111318]">
                ₱{product.price_php.toFixed(2)}
              </div>
              {product.discount_percent > 0 && (
                <div className="text-[10px] text-[#0F5132] flex items-center gap-0.5 mt-0.5 font-bold">
                  <TrendingDown className="w-3 h-3" />
                  <span><span className="font-data">{product.discount_percent}%</span> off regular SRP</span>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
              <div className="text-[10px] text-[#0F5132] font-bold uppercase tracking-wider flex items-center justify-between mb-1">
                <span>Price / 100g</span>
                <LearnTooltip topicKey="unit_price" iconOnly />
              </div>
              <div className="text-xl font-data tabular-nums font-bold text-[#0F5132]">
                ₱{product.price_per_100g.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#0F5132]/80 mt-0.5 font-data">
                ₱{product.price_per_gram.toFixed(3)} / gram
              </div>
            </div>

            <div className="p-3.5 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl">
              <div className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider flex items-center justify-between mb-1">
                <span>Price Index</span>
                <LearnTooltip topicKey="price_index" iconOnly />
              </div>
              <div className="text-xl font-data tabular-nums font-bold text-[#111318]">{product.price_index}</div>
              <div
                className={`text-[10px] font-medium mt-0.5 ${
                  isBelowMedian ? 'text-[#0F5132]' : 'text-[#B45309]'
                }`}
              >
                <span className="font-data">{Math.abs(product.relative_percent_vs_median)}%</span>{' '}
                {isBelowMedian ? 'below median' : 'above median'}
              </div>
            </div>

            <div className="p-3.5 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl">
              <div className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider flex items-center justify-between mb-1">
                <span>Value Score</span>
                <LearnTooltip topicKey="value_score" iconOnly />
              </div>
              <div className="text-xl font-data tabular-nums font-bold text-[#111318] flex items-baseline gap-1">
                <span>{product.value_score}</span>
                <span className="text-xs text-[#6B7280] font-normal">/100</span>
              </div>
              <div className="text-[10px] text-[#6B7280] mt-0.5">
                Rating: <span className="font-data font-semibold">{product.rating.toFixed(1)} ★</span> (<span className="font-data">{product.review_count}</span>)
              </div>
            </div>
          </div>

          {/* Unit Normalization Insight Banner */}
          <div className="p-3.5 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl text-xs text-[#111318] space-y-1">
            <div className="font-semibold text-[#111318] flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#0F5132]" />
              <span className="font-bold tracking-wider uppercase text-[10px] text-[#0F5132]">Unit Economics &amp; Package Sizing Calculation</span>
            </div>
            <p className="text-[#6B7280] leading-relaxed text-xs">
              Total net package weight:{' '}
              <strong className="text-[#111318] font-data">{product.total_weight_grams} grams</strong>.
              Effective normalized unit cost:{' '}
              <strong className="text-[#0F5132] font-data tabular-nums font-bold">₱{product.price_per_100g.toFixed(2)} per 100g</strong>.
              {product.is_multipack && (
                <span className="text-[#B45309] font-medium ml-1">
                  Sold as a bundle/twin-pack. Evaluated on aggregate weight (not as a single unit).
                </span>
              )}
            </p>
          </div>

          {/* Clinical & Formulation Attributes */}
          <div>
            <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2.5">
              Observed Formulation Attributes
            </h4>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {product.fluoride && (
                <span className="px-2.5 py-1 bg-[#F0FDF4] border border-[#DCFCE7] text-[#0F5132] rounded-md text-[11px] font-semibold">
                  ✓ Fluoride (Anti-Cavity)
                </span>
              )}
              {product.whitening && (
                <span className="px-2.5 py-1 bg-[#F8F9FB] border border-[#E8E9EC] text-[#111318] rounded-md text-[11px] font-medium">
                  ✓ Whitening Active
                </span>
              )}
              {product.sensitivity && (
                <span className="px-2.5 py-1 bg-[#F0FDF4] border border-[#DCFCE7] text-[#0F5132] rounded-md text-[11px] font-semibold">
                  ✓ Sensitivity Relief
                </span>
              )}
              {product.gum_care && (
                <span className="px-2.5 py-1 bg-[#F8F9FB] border border-[#E8E9EC] text-[#111318] rounded-md text-[11px] font-medium">
                  ✓ Gum Health Active
                </span>
              )}
              {product.charcoal && (
                <span className="px-2.5 py-1 bg-[#F8F9FB] border border-[#E8E9EC] text-[#111318] rounded-md text-[11px] font-medium">
                  ✓ Charcoal Formula
                </span>
              )}
              {product.herbal && (
                <span className="px-2.5 py-1 bg-[#F0FDF4] border border-[#DCFCE7] text-[#0F5132] rounded-md text-[11px] font-semibold">
                  ✓ Herbal / Botanical
                </span>
              )}
              {product.kids && (
                <span className="px-2.5 py-1 bg-[#F8F9FB] border border-[#E8E9EC] text-[#111318] rounded-md text-[11px] font-medium">
                  ✓ Kids Mild Formula
                </span>
              )}
              {product.origin && (
                <span className="px-2.5 py-1 bg-[#F8F9FB] border border-[#E8E9EC] text-[#6B7280] rounded-md text-[11px]">
                  Origin: {product.origin}
                </span>
              )}
            </div>
          </div>

          {/* Cross-Retailer Price Comparison for Identical SKU */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>Price Dispersion Across Retailers for this SKU</span>
              </h4>
              <LearnTooltip topicKey="price_dispersion" iconOnly />
            </div>

            {retailerSiblings.length > 1 ? (
              <div className="border border-[#E8E9EC] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8F9FB] border-b border-[#E8E9EC] text-[#6B7280] font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Retailer</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Promo Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[#111318]">
                    {retailerSiblings
                      .sort((a, b) => a.price_php - b.price_php)
                      .map((sib, i) => (
                        <tr
                          key={sib.product_id}
                          className={sib.product_id === product.product_id ? 'bg-[#F0FDF4]/60 font-medium' : 'hover:bg-[#F8F9FB]'}
                        >
                          <td className="py-2.5 px-3 flex items-center gap-1.5">
                            <span className="font-semibold">{sib.retailer}</span>
                            {i === 0 && (
                              <span className="text-[9px] uppercase tracking-wider bg-[#0F5132] text-white px-1.5 py-0.5 rounded font-bold">
                                Lowest
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[#6B7280]">{sib.retailer_type}</td>
                          <td className="py-2.5 px-3 text-right font-data tabular-nums font-bold text-[#111318]">₱{sib.price_php.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-[#0F5132] font-data tabular-nums font-bold">
                            ₱{sib.price_per_100g.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {sib.discount_percent > 0 ? (
                              <span className="text-[#0F5132] font-bold">
                                <span className="font-data">-{sib.discount_percent}%</span> Promo
                              </span>
                            ) : (
                              <span className="text-[#6B7280]">Regular</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl text-xs text-[#6B7280]">
                Only single retailer observation (<strong>{product.retailer}</strong>) recorded for this exact SKU in current dataset snapshot.
              </div>
            )}
          </div>

          {/* Historical Price Trend Points if available */}
          {product.historical_prices && product.historical_prices.length > 1 && (
            <div>
              <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>Observed Historical Price Trajectory</span>
              </h4>
              <div className="border border-[#E8E9EC] rounded-xl p-3 bg-[#F8F9FB]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#6B7280]">Historical snapshots:</span>
                  <span className="text-[#111318] font-data font-medium">
                    {product.historical_prices[0].date} to{' '}
                    {product.historical_prices[product.historical_prices.length - 1].date}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {product.historical_prices.map((hp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-[#E8E9EC] last:border-0"
                    >
                      <span className="text-[#6B7280] font-data text-[11px]">{hp.date}</span>
                      <span className="text-[#111318]">{hp.retailer}</span>
                      <span className="font-data tabular-nums font-bold text-[#111318]">₱{hp.price_php.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Traceability & Trust Footnote */}
          <div className="p-3 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl text-[10px] text-[#6B7280] space-y-1">
            <div className="flex items-center justify-between">
              <span>
                <strong className="text-[#111318]">Data Source:</strong> {product.source}
              </span>
              <span>
                <strong className="text-[#111318]">Collected:</strong> <span className="font-data">{product.date_collected}</span>
              </span>
            </div>
            <p className="text-[#9CA3AF]">
              Disclaimer: Prices reflect recorded snapshot observations. Retailer promotions and shelf prices may change. Does not constitute dental or medical advice.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#F8F9FB] border-t border-[#E8E9EC]">
          {product.product_url ? (
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0F5132] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>View retailer listing</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {handleCompare && (
              <button
                id="modal-add-compare-btn"
                type="button"
                onClick={() => {
                  handleCompare(product);
                  onClose();
                }}
                className="text-xs bg-white hover:bg-[#F8F9FB] text-[#111318] font-semibold py-2 px-3.5 rounded-lg border border-[#E8E9EC] transition-all shadow-xs cursor-pointer"
              >
                {isCompared ? 'Compared in tray' : '+ Add to Comparison'}
              </button>
            )}
            <button
              id="modal-done-btn"
              type="button"
              onClick={onClose}
              className="text-xs bg-[#111318] hover:bg-black text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
