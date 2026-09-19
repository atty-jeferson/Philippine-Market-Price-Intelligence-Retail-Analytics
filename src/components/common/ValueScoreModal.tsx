import React from 'react';
import { X, Sliders, RotateCcw, Info } from 'lucide-react';
import { ValueScoreWeights } from '../../types';
import { DEFAULT_VALUE_WEIGHTS } from '../../utils/calculations';

interface ValueScoreModalProps {
  isOpen?: boolean;
  onClose: () => void;
  weights: ValueScoreWeights;
  onWeightsChange?: (newWeights: ValueScoreWeights) => void;
  onSaveWeights?: (newWeights: ValueScoreWeights) => void;
}

export const ValueScoreModal: React.FC<ValueScoreModalProps> = ({
  isOpen = true,
  onClose,
  weights,
  onWeightsChange,
  onSaveWeights
}) => {
  if (!isOpen) return null;

  const notifyChange = (newWeights: ValueScoreWeights) => {
    if (onWeightsChange) onWeightsChange(newWeights);
    if (onSaveWeights) onSaveWeights(newWeights);
  };

  const total =
    weights.unitPriceAdvantage +
    weights.productRating +
    weights.discount +
    weights.featureCoverage +
    weights.brandPositioning;

  const updateWeight = (key: keyof ValueScoreWeights, val: number) => {
    notifyChange({
      ...weights,
      [key]: Math.max(0, Math.min(100, val))
    });
  };

  const handleReset = () => {
    notifyChange(DEFAULT_VALUE_WEIGHTS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div
        id="value-score-config-modal"
        className="bg-white rounded-xl shadow-2xl border border-[#E8E9EC] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-[#111318]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E9EC] bg-[#F8F9FB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F0FDF4] text-[#0F5132] rounded-lg border border-[#DCFCE7]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#111318] text-base">Value Score Model Weights</h3>
              <p className="text-xs text-[#6B7280]">Customize the applied pricing scoring parameters</p>
            </div>
          </div>
          <button
            id="close-value-score-modal"
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111318] p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="p-3 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl flex items-start gap-2.5 text-xs text-[#111318]">
            <Info className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
            <p>
              <strong className="text-[#111318] font-bold">Methodological Note:</strong> Value Score is a multi-attribute decision
              model metric. It is not an evaluation of clinical tooth efficacy or medical quality.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Weight 1: Unit Price */}
            <div>
              <div className="flex justify-between font-semibold text-[#111318] mb-1.5">
                <span>Unit-Price Advantage (Lower ₱/100g)</span>
                <span className="font-data tabular-nums font-bold text-[#0F5132]">{weights.unitPriceAdvantage}%</span>
              </div>
              <input
                id="slider-unit-price"
                type="range"
                min="0"
                max="80"
                value={weights.unitPriceAdvantage}
                onChange={(e) => updateWeight('unitPriceAdvantage', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#E8E9EC] rounded-lg appearance-none cursor-pointer accent-[#0F5132]"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Rewards products with lower normalized price per 100g relative to the market range.
              </p>
            </div>

            {/* Weight 2: Product Rating */}
            <div>
              <div className="flex justify-between font-semibold text-[#111318] mb-1.5">
                <span>Product Rating &amp; Reviews</span>
                <span className="font-data tabular-nums font-bold text-[#0F5132]">{weights.productRating}%</span>
              </div>
              <input
                id="slider-product-rating"
                type="range"
                min="0"
                max="60"
                value={weights.productRating}
                onChange={(e) => updateWeight('productRating', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#E8E9EC] rounded-lg appearance-none cursor-pointer accent-[#0F5132]"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Incorporates observed consumer satisfaction and community review confidence.
              </p>
            </div>

            {/* Weight 3: Promotional Discount */}
            <div>
              <div className="flex justify-between font-semibold text-[#111318] mb-1.5">
                <span>Promotional Discount Depth</span>
                <span className="font-data tabular-nums font-bold text-[#0F5132]">{weights.discount}%</span>
              </div>
              <input
                id="slider-discount"
                type="range"
                min="0"
                max="50"
                value={weights.discount}
                onChange={(e) => updateWeight('discount', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#E8E9EC] rounded-lg appearance-none cursor-pointer accent-[#0F5132]"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Rewards currently active temporary price cuts and multi-pack promotional savings.
              </p>
            </div>

            {/* Weight 4: Feature Coverage */}
            <div>
              <div className="flex justify-between font-semibold text-[#111318] mb-1.5">
                <span>Feature &amp; Benefit Coverage</span>
                <span className="font-data tabular-nums font-bold text-[#0F5132]">{weights.featureCoverage}%</span>
              </div>
              <input
                id="slider-feature-coverage"
                type="range"
                min="0"
                max="50"
                value={weights.featureCoverage}
                onChange={(e) => updateWeight('featureCoverage', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#E8E9EC] rounded-lg appearance-none cursor-pointer accent-[#0F5132]"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Scores breadth of functional claims (fluoride, enamel, sensitivity, whitening, gum care).
              </p>
            </div>

            {/* Weight 5: Brand Positioning */}
            <div>
              <div className="flex justify-between font-semibold text-[#111318] mb-1.5">
                <span>Positioning Tier Accessibility</span>
                <span className="font-data tabular-nums font-bold text-[#0F5132]">{weights.brandPositioning}%</span>
              </div>
              <input
                id="slider-positioning"
                type="range"
                min="0"
                max="40"
                value={weights.brandPositioning}
                onChange={(e) => updateWeight('brandPositioning', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#E8E9EC] rounded-lg appearance-none cursor-pointer accent-[#0F5132]"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Weights everyday affordability tier positioning (budget &amp; mainstream vs luxury specialty).
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#F8F9FB] border border-[#E8E9EC] rounded-xl flex items-center justify-between text-xs">
            <span className="text-[#6B7280] font-medium">Configured Total Weight Sum:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded font-data tabular-nums ${
                total === 100
                  ? 'bg-[#F0FDF4] text-[#0F5132] border border-[#DCFCE7]'
                  : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
              }`}
            >
              {total}% {total !== 100 ? '(Normalized dynamically to 100%)' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-[#F8F9FB] border-t border-[#E8E9EC]">
          <button
            id="reset-weights-btn"
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111318] font-semibold py-1.5 px-3 rounded-lg border border-[#E8E9EC] hover:bg-white transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            id="apply-weights-btn"
            type="button"
            onClick={onClose}
            className="text-xs bg-[#111318] hover:bg-black text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            Apply &amp; Recalculate
          </button>
        </div>
      </div>
    </div>
  );
};
