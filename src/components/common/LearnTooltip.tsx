import React, { useState } from 'react';
import { HelpCircle, X, ExternalLink } from 'lucide-react';

export interface LearnTopic {
  term: string;
  definition: string;
  formula?: string;
  interpretation?: string;
}

export const LEARN_GLOSSARY: Record<string, LearnTopic> = {
  unit_price: {
    term: 'Unit Price (Price per 100g / 100ml)',
    definition:
      'Standardized cost per unit of measure, eliminating distorted package size comparisons.',
    formula: 'Unit Price = (Price in PHP / Weight in Grams) × 100',
    interpretation:
      'A ₱200 large tube is often cheaper per gram than a ₱120 small tube. Always compare price per 100g.'
  },
  price_index: {
    term: 'Market Price Index (Base 100)',
    definition:
      'Relative price metric measuring how a product’s normalized unit price compares to the market median.',
    formula: 'Price Index = (Product Price per 100g / Market Median per 100g) × 100',
    interpretation:
      'Index = 100 is exact market median. Index = 72 means 28% cheaper than median. Index = 145 means 45% above median.'
  },
  brand_premium: {
    term: 'Brand Price Premium (%)',
    definition:
      'The median normalized unit price differential commanded by a brand compared to the market median benchmark.',
    formula: 'Premium % = ((Brand Median Unit Price - Market Median) / Market Median) × 100',
    interpretation:
      'Reflects consumer willingness-to-pay, brand positioning, formulation complexity, and marketing equity.'
  },
  price_dispersion: {
    term: 'Price Dispersion & Coefficient of Variation (CV)',
    definition:
      'Statistical measure of price variability and spread across products or retailers in the market.',
    formula: 'CV = (Sample Standard Deviation / Sample Mean) × 100%',
    interpretation:
      'A higher CV indicates wider price dispersion and higher potential consumer search gains.'
  },
  size_economics: {
    term: 'Size Economics & Packaging Elasticity',
    definition:
      'Econometric relationship evaluating volume discounts between tube size and price per gram.',
    formula: 'log(Price per 100g) = β0 + β1 log(Package Size) + ε',
    interpretation:
      'A negative β1 coefficient indicates that larger package sizes offer significant per-unit economies.'
  },
  hedonic_pricing: {
    term: 'Hedonic Pricing Model',
    definition:
      'Applied microeconomic regression decomposing product price into implicit values of specific attributes.',
    formula: 'log(P) = β0 + Σ βi · Attribute_i + ε',
    interpretation:
      'Estimates the market price premium associated with features like sensitivity relief, whitening, or herbal actives, ceteris paribus.'
  },
  brand_presence_vs_hhi: {
    term: 'Brand Presence vs True Market Share',
    definition:
      'Methodological caveat distinguishing catalog shelf presence from commercial revenue share.',
    interpretation:
      'This dataset measures observed shelf SKU counts, NOT unit sales volume or commercial revenue. True HHI cannot be estimated from retail listings alone.'
  },
  value_score: {
    term: 'Model Value Score (0–100)',
    definition:
      'A composite benchmark balancing unit-price advantage, consumer ratings, active discounts, and dental feature coverage.',
    interpretation:
      'Model-based ranking metric to support consumer decisions. It is not an absolute measure of chemical quality or clinical efficacy.'
  }
};

interface LearnTooltipProps {
  topicKey: keyof typeof LEARN_GLOSSARY;
  label?: string;
  iconOnly?: boolean;
}

export const LearnTooltip: React.FC<LearnTooltipProps> = ({
  topicKey,
  label,
  iconOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const topic: LearnTopic = LEARN_GLOSSARY[topicKey] || {
    term: topicKey,
    definition: 'Educational note',
    formula: undefined,
    interpretation: undefined
  };

  return (
    <span className="relative inline-flex items-center align-middle font-sans">
      <button
        type="button"
        id={`learn-btn-${topicKey}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center text-[10px] uppercase tracking-wider text-[#0F5132] hover:text-[#0B3D26] bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#DCFCE7] px-1.5 py-0.5 rounded-md transition-colors focus:outline-none cursor-pointer"
        title={`Learn about ${topic.term}`}
      >
        {!iconOnly && <span className="font-semibold mr-1">{label || 'Learn'}</span>}
        <HelpCircle className="w-3 h-3 text-[#0F5132]" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 w-80 max-w-[90vw] z-50 p-4 bg-white border border-[#E8E9EC] rounded-xl shadow-2xl text-[#111318] text-xs">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E8E9EC] mb-2">
              <div className="font-bold text-[#111318] text-sm">{topic.term}</div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#6B7280] hover:text-[#111318] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[#6B7280] leading-relaxed mb-2 text-xs">{topic.definition}</p>

            {topic.formula && (
              <div className="bg-[#F8F9FB] border border-[#E8E9EC] rounded-lg p-2 mb-2 font-data text-[11px] text-[#0F5132]">
                {topic.formula}
              </div>
            )}

            {topic.interpretation && (
              <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg p-2 text-[#111318] text-[11px] leading-relaxed">
                <span className="font-bold text-[#0F5132]">Interpretation: </span>
                {topic.interpretation}
              </div>
            )}
          </div>
        </>
      )}
    </span>
  );
};
