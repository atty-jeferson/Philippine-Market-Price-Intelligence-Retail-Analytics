import React from 'react';
import { CrossRetailerSKUComparison } from '../../types';
import { ChartCard } from './ChartCard';
import { RetailerSKUMatrix } from './RetailerSKUMatrix';
import { EvidenceStatus } from './ChartHeader';

export interface PriceHeatmapProps {
  id?: string;
  crossRetailerSKUs: CrossRetailerSKUComparison[];
  marketMedian100g: number;
  onSelectSKU?: (sku: CrossRetailerSKUComparison) => void;
  badge?: EvidenceStatus;
  className?: string;
}

export const PriceHeatmap: React.FC<PriceHeatmapProps> = ({
  id = 'price-heatmap-matrix',
  crossRetailerSKUs,
  marketMedian100g,
  onSelectSKU,
  badge = 'OBSERVED',
  className = ''
}) => {
  const isEmpty = !crossRetailerSKUs || crossRetailerSKUs.length === 0;

  return (
    <ChartCard
      id={id}
      title="Cross-Retailer SKU Price Dispersion Matrix"
      question="Where and by how much does the exact same SKU vary across retail banners?"
      badge={badge}
      benchmarkLabel={marketMedian100g !== undefined && marketMedian100g !== null ? `Category Parity: ₱${marketMedian100g.toFixed(2)}/100g (Index 100.0)` : undefined}
      topicKey="channel_dispersion"
      sourceText="Direct Modern Trade Shelf Inspections"
      observationPeriod="Audit Cycle Sep 2026"
      sampleSize={crossRetailerSKUs?.length ?? 0}
      isEmpty={isEmpty}
      className={className}
    >
      <div className="pt-2">
        <RetailerSKUMatrix
          crossRetailerSKUs={crossRetailerSKUs || []}
          marketMedian100g={marketMedian100g ?? 0}
          onSelectSKU={onSelectSKU}
        />
      </div>
    </ChartCard>
  );
};
