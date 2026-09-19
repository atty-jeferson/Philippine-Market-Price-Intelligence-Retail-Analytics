import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { HistoricalPricePoint } from '../../types';
import { ChartCard } from './ChartCard';
import { EvidenceStatus } from './ChartHeader';

export interface PriceEventItem {
  date: string;
  price: number;
  regularPrice: number;
  type: 'promo' | 'hike' | 'cut' | 'stable';
  deltaPercent: number;
  description: string;
}

interface PriceMovementChartProps {
  id?: string;
  history: HistoricalPricePoint[];
  productName?: string;
  badge?: EvidenceStatus;
  className?: string;
}

export const PriceMovementChart: React.FC<PriceMovementChartProps> = ({
  id = 'price-movement-chart',
  history,
  productName,
  badge = 'OBSERVED',
  className = ''
}) => {
  const events: PriceEventItem[] = React.useMemo(() => {
    if (!history || history.length === 0) return [];

    const list: PriceEventItem[] = [];
    for (let i = 0; i < history.length; i++) {
      const cur = history[i];
      const prev = i > 0 ? history[i - 1] : null;

      let type: 'promo' | 'hike' | 'cut' | 'stable' = 'stable';
      let deltaPercent = 0;
      let description = 'Regular listed shelf price';

      if (cur.is_promotion) {
        type = 'promo';
        deltaPercent = -(cur.discount_percent || 0);
        description = `Temporary promotional discount (-${cur.discount_percent}%)`;
      } else if (prev) {
        const diff = cur.price - prev.price;
        if (Math.abs(diff) > 0.5) {
          deltaPercent = Number(((diff / prev.price) * 100).toFixed(1));
          if (diff > 0) {
            type = 'hike';
            description = `Base price increase (+₱${diff.toFixed(2)}, +${deltaPercent}%)`;
          } else {
            type = 'cut';
            description = `Permanent shelf rollback (-₱${Math.abs(diff).toFixed(2)}, ${deltaPercent}%)`;
          }
        }
      }

      list.push({
        date: cur.date,
        price: cur.price,
        regularPrice: cur.regular_price || cur.price,
        type,
        deltaPercent,
        description
      });
    }
    return list;
  }, [history]);

  const isEmpty = !history || history.length === 0;

  return (
    <ChartCard
      id={id}
      title={productName ? `Price Movement Events: ${productName}` : 'Price Event Movement Log'}
      question="When did prices change, and what promotional or rollback events were detected?"
      badge={badge}
      topicKey="price_trends"
      sourceText="Longitudinal Store Audits"
      observationPeriod="Aug 2025 – Sep 2026"
      sampleSize={history?.length || 0}
      isEmpty={isEmpty}
      className={className}
    >
      <div className="space-y-4">
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={events} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0EA" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#737A74' }}
                tickLine={false}
                axisLine={{ stroke: '#E3E6DF' }}
              />
              <YAxis
                unit="₱"
                tick={{ fontSize: 11, fill: '#737A74' }}
                tickLine={false}
                axisLine={{ stroke: '#E3E6DF' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as PriceEventItem;
                    return (
                      <div className="bg-white text-[#163829] p-3 rounded-xl border border-[#E3E6DF] text-xs space-y-1.5 shadow-card min-w-[200px]">
                        <div className="font-bold text-[#163829] border-b border-[#EEF0EA] pb-1 flex items-center justify-between">
                          <span>{d.date}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              d.type === 'promo'
                                ? 'bg-[#FDF4F3] text-[#C04D44] border border-[#F5C8C4]'
                                : d.type === 'hike'
                                ? 'bg-[#FFFDF5] text-[#B8860B] border border-[#F4E8B8]'
                                : d.type === 'cut'
                                ? 'bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1]'
                                : 'bg-[#FAFAF7] text-[#4F5751] border border-[#E3E6DF]'
                            }`}
                          >
                            {d.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#737A74]">Audited Price:</span>
                          <span className="font-data font-bold text-[#163829]">
                            ₱{d.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#4F5751] pt-1 border-t border-[#EEF0EA]">
                          {d.description}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="stepAfter"
                dataKey="price"
                name="Audited Price"
                stroke="#176B4D"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  let dotFill = '#176B4D';
                  if (payload.type === 'promo') dotFill = '#C04D44';
                  if (payload.type === 'hike') dotFill = '#B8860B';
                  if (payload.type === 'cut') dotFill = '#176B4D';

                  return (
                    <circle
                      key={`event-dot-${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={payload.type !== 'stable' ? 5 : 3}
                      fill={dotFill}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event List Table */}
        <div className="border border-[#E3E6DF] rounded-xl overflow-hidden text-xs">
          <div className="bg-[#FAFAF7] px-3.5 py-2.5 border-b border-[#E3E6DF] font-bold text-[#163829] flex items-center justify-between">
            <span>Historical Event Log</span>
            <span className="text-[11px] font-data text-[#737A74] font-normal">
              {events.length} audited observation points
            </span>
          </div>
          <div className="divide-y divide-[#EEF0EA] max-h-40 overflow-y-auto">
            {events.map((evt, idx) => (
              <div key={idx} className="px-3.5 py-2 flex items-center justify-between hover:bg-[#FAFAF7] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="font-data text-[#737A74] text-[11px]">{evt.date}</span>
                  <span className="text-[#3B4840] font-medium">{evt.description}</span>
                </div>
                <div className="font-data font-bold text-[#163829]">
                  ₱{evt.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  );
};
