import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Store,
  Layers,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  Database,
  Search,
  ExternalLink,
  ChevronRight,
  Eye,
  Scale,
  Sparkles,
  Lock,
  Tag,
  Building2,
  FileSpreadsheet,
  Activity,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  MarketSummaryKPIs,
  NormalizedProduct,
  CrossRetailerSKUComparison,
  TabType
} from '../../types';
import { InvestigationOpportunity } from '../../domain/opportunities';
import { TheGrocerLogo } from '../common/TheGrocerLogo';

interface LandingPageProps {
  kpis: MarketSummaryKPIs;
  products: NormalizedProduct[];
  crossRetailer: CrossRetailerSKUComparison[];
  opportunities: InvestigationOpportunity[];
  onEnterApp: (tab?: TabType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  kpis,
  products,
  crossRetailer,
  opportunities,
  onEnterApp
}) => {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'price' | 'competitive' | 'market'>('price');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const topOpportunities = opportunities.slice(0, 3);
  const sampleCrossRetailer = crossRetailer.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#163829] font-sans selection:bg-[#EEF4EE] selection:text-[#176B4D]">
      {/* 1. PUBLIC NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E3E6DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left group cursor-pointer"
            >
              <TheGrocerLogo size="sm" subtitle="Philippine Retail Market Intelligence" />
            </button>
          </div>

          {/* Nav Anchor Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-[#4F5751]">
            <button
              type="button"
              onClick={() => scrollToSection('platform')}
              className="hover:text-[#176B4D] transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('intelligence')}
              className="hover:text-[#176B4D] transition-colors cursor-pointer"
            >
              Intelligence
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('command-center')}
              className="hover:text-[#176B4D] transition-colors cursor-pointer"
            >
              Command Center
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('methodology')}
              className="hover:text-[#176B4D] transition-colors cursor-pointer"
            >
              Methodology
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('for-business')}
              className="hover:text-[#176B4D] transition-colors cursor-pointer"
            >
              For Business
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSignInModalOpen(true)}
              className="text-xs font-bold text-[#4F5751] hover:text-[#163829] px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('home')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#176B4D] hover:bg-[#13583F] rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <span>Launch Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden border-b border-[#E8E9EC] bg-white">
        {/* Subtle architectural background grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#176B4D 0.75px, transparent 0.75px)`,
            backgroundSize: '24px 24px',
            opacity: 0.15
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF4EE] border border-[#DDEBE1] text-[#176B4D] text-[11px] uppercase tracking-wider font-sans font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#176B4D]" />
                PHILIPPINE RETAIL MARKET INTELLIGENCE
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-[#163829] tracking-tight leading-[1.12]">
                Institutional-grade shelf pricing &amp; <br className="hidden sm:inline" />
                <span className="text-[#176B4D]">retail unit economics.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#4F5751] leading-relaxed max-w-xl font-sans">
                Standardized shelf pricing, pack-size unit economics, cross-channel price dispersion, and real-time competitive signals across modern trade supermarkets and pharmacy chains in the Philippines.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onEnterApp('home')}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold text-white bg-[#176B4D] hover:bg-[#13583F] rounded-xl transition-all shadow-sm cursor-pointer font-sans"
                >
                  <span>Launch Market Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEnterApp('explorer')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold text-[#163829] bg-white hover:bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl transition-colors shadow-xs cursor-pointer font-sans"
                >
                  <span>Explore Oral Care Category</span>
                  <ChevronRight className="w-4 h-4 text-[#737A74]" />
                </button>
              </div>

              {/* Trust Signals Strip */}
              <div className="pt-6 border-t border-[#EEF0EA] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EEF4EE] border border-[#DDEBE1] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#176B4D]" />
                  </div>
                  <div>
                    <div className="font-bold font-data tabular-nums text-[#163829] text-xs">80+ Audited SKUs</div>
                    <div className="text-[10px] text-[#737A74]">Store-inspected</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E3E6DF] flex items-center justify-center shrink-0 shadow-2xs">
                    <Store className="w-4 h-4 text-[#176B4D]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#163829] text-xs">4 Retail Banners</div>
                    <div className="text-[10px] text-[#737A74]">SM &bull; Puregold &bull; Mercury</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E3E6DF] flex items-center justify-center shrink-0 shadow-2xs">
                    <Activity className="w-4 h-4 text-[#176B4D]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#163829] text-xs">Longitudinal Audits</div>
                    <div className="text-[10px] text-[#737A74]">Multi-cycle tracking</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EEF4EE] border border-[#DDEBE1] flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4 text-[#176B4D]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#163829] text-xs">Unit Economics</div>
                    <div className="text-[10px] text-[#737A74]">Standardized ₱/100g</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Live Visual / Product Cockpit Mockup */}
            <div className="lg:col-span-6">
              <div className="relative rounded-xl border border-[#E3E6DF] bg-[#FAFAF7] shadow-xl overflow-hidden">
                {/* Visual Header Bar */}
                <div className="bg-[#EEF4EE] border-b border-[#DDEBE1] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#176B4D]" />
                    <span className="font-bold tracking-wider text-xs font-sans text-[#163829]">
                      THE GROCER COMMAND CENTER
                    </span>
                    <span className="text-[10px] text-[#737A74] hidden sm:inline">|</span>
                    <span className="text-[10px] text-[#737A74] hidden sm:inline font-sans">
                      Metro Manila Retail Audit
                    </span>
                  </div>
                  <div className="text-[10px] font-sans font-bold text-[#176B4D] bg-white px-2 py-0.5 rounded border border-[#DDEBE1]">
                    LIVE DATA
                  </div>
                </div>

                {/* Sub-bar with audit metadata */}
                <div className="bg-[#FAFAF7] border-b border-[#E3E6DF] text-[#737A74] px-4 py-1.5 text-[10px] flex items-center justify-between font-sans">
                  <span>CATEGORY: ORAL CARE (TOOTHPASTE)</span>
                  <span className="font-data font-semibold text-[#163829]">BASE 100 = ₱{kpis.medianPricePer100g.toFixed(2)}/100g</span>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-4 bg-[#FAFAF7]">
                  {/* Top Metric Strip */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white p-3 rounded-xl border border-[#E3E6DF] shadow-2xs">
                      <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold font-sans">
                        Market Median
                      </div>
                      <div className="text-lg sm:text-xl font-bold font-data tabular-nums text-[#163829] mt-0.5">
                        ₱{kpis.medianPricePer100g.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-[#737A74] mt-0.5 font-sans">Standardized / 100g</div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E3E6DF] shadow-2xs">
                      <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold font-sans">
                        MoM Movement
                      </div>
                      <div className="text-lg sm:text-xl font-bold font-data tabular-nums text-[#176B4D] mt-0.5 flex items-center gap-1">
                        <span>Stable</span>
                      </div>
                      <div className="text-[9px] text-[#737A74] mt-0.5 font-sans">Rolling 30 Days</div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E3E6DF] shadow-2xs">
                      <div className="text-[10px] uppercase tracking-wider text-[#737A74] font-bold font-sans">
                        Active Banners
                      </div>
                      <div className="text-lg sm:text-xl font-bold font-data tabular-nums text-[#163829] mt-0.5">
                        {kpis.totalRetailers} Channels
                      </div>
                      <div className="text-[9px] text-[#737A74] mt-0.5 font-sans">{kpis.totalProducts} Audited SKUs</div>
                    </div>
                  </div>

                  {/* "What Requires Attention" Anomaly Feed Preview */}
                  <div className="bg-white rounded-xl border border-[#E3E6DF] p-3.5 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#EEF0EA] pb-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#B8860B]" />
                        <span className="text-xs font-bold text-[#163829] tracking-tight font-sans">
                          WHAT REQUIRES ATTENTION
                        </span>
                      </div>
                      <span className="text-[10px] font-sans font-bold text-[#176B4D]">
                        {opportunities.length} Commercial Signals
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {topOpportunities.map((opp, oppIdx) => (
                        <div
                          key={opp.opportunity_id || opp.id || oppIdx}
                          onClick={() => onEnterApp('opportunities')}
                          className="p-2 rounded-lg bg-[#FAFAF7] hover:bg-white border border-[#E3E6DF] hover:border-[#176B4D]/40 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-sans ${
                                  opp.severity === 'HIGH'
                                    ? 'bg-[#FDF4F3] text-[#C04D44] border border-[#F5C8C4]'
                                    : 'bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5]'
                                }`}
                              >
                                {opp.severity}
                              </span>
                              <span className="font-bold text-[#163829] truncate">
                                {opp.title}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#737A74] truncate mt-0.5 font-sans">
                              {opp.hypothesis}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#737A74] shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual Footer / Launch Trigger */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-[#737A74] flex items-center gap-1.5 font-sans">
                      <Database className="w-3.5 h-3.5 text-[#176B4D]" />
                      <span>Audit: Puregold, SM, Mercury, Robinsons, Watson&apos;s</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEnterApp('home')}
                      className="text-xs font-bold text-[#176B4D] hover:underline inline-flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST / MARKET STATEMENT BAR */}
      <section className="bg-[#EEF4EE] text-[#163829] py-8 border-y border-[#DDEBE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-[#DDEBE1]">
            <div className="pt-4 md:pt-0 px-4">
              <div className="text-2xl sm:text-3xl font-bold font-data text-[#176B4D]">
                {kpis.totalProducts}
              </div>
              <div className="text-xs text-[#737A74] uppercase tracking-wider font-semibold mt-1 font-sans">
                Audited Toothpaste SKUs
              </div>
            </div>
            <div className="pt-4 md:pt-0 px-4">
              <div className="text-2xl sm:text-3xl font-bold font-data text-[#163829]">
                {kpis.totalBrands} Brands
              </div>
              <div className="text-xs text-[#737A74] uppercase tracking-wider font-semibold mt-1 font-sans">
                Colgate, Sensodyne, Closeup &amp; More
              </div>
            </div>
            <div className="pt-4 md:pt-0 px-4">
              <div className="text-2xl sm:text-3xl font-bold font-data text-[#163829]">
                7 Major Banners
              </div>
              <div className="text-xs text-[#737A74] uppercase tracking-wider font-semibold mt-1 font-sans">
                Modern Trade &amp; Pharmacy
              </div>
            </div>
            <div className="pt-4 md:pt-0 px-4">
              <div className="text-2xl sm:text-3xl font-bold font-data text-[#176B4D]">
                100%
              </div>
              <div className="text-xs text-[#737A74] uppercase tracking-wider font-semibold mt-1 font-sans">
                Deterministic Evidence
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT THE GROCER DOES */}
      <section id="platform" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="text-xs font-bold uppercase tracking-wider text-[#176B4D]">
            Core Analytical Process
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#163829] tracking-tight">
            From Shelf Data to Market Intelligence
          </h2>
          <p className="text-sm sm:text-base text-[#4F5751] leading-relaxed font-sans">
            Raw retail price lists are noisy and deceptive due to promotional volatility, pack-size
            differences, and disparate retailer formats. THE GROCER systematically structures observations
            into strategic commercial intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 relative shadow-card">
            <div className="text-2xl font-black font-data text-[#DDEBE1]">01</div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] text-[10px] font-bold uppercase tracking-wider font-sans">
              Collect
            </div>
            <h3 className="text-base font-bold text-[#163829]">OBSERVE</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Systematic retail auditing across physical supermarket shelves and verified digital channels
              in the Philippines.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 relative shadow-card">
            <div className="text-2xl font-black font-data text-[#DDEBE1]">02</div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] text-[10px] font-bold uppercase tracking-wider font-sans">
              Standardize
            </div>
            <h3 className="text-base font-bold text-[#163829]">MEASURE</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Normalizing package formats into standard unit economics (₱/100g), Price Competitiveness
              Index (PCI), and Relative Price Position (RPP).
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 relative shadow-card">
            <div className="text-2xl font-black font-data text-[#DDEBE1]">03</div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] text-[10px] font-bold uppercase tracking-wider font-sans">
              Contextualize
            </div>
            <h3 className="text-base font-bold text-[#163829]">UNDERSTAND</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Algorithmic peer sets, pack size elasticity curves, brand price architecture, and cross-channel
              markup waterfalls.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 relative shadow-card">
            <div className="text-2xl font-black font-data text-[#DDEBE1]">04</div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5] text-[10px] font-bold uppercase tracking-wider font-sans">
              Action
            </div>
            <h3 className="text-base font-bold text-[#163829]">DECIDE</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Synthesizing material competitive gaps, retail dispersion anomalies, and promotional
              dependencies into verified investigation opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* 5. THREE MAJOR FEATURE STORIES */}
      <section id="intelligence" className="py-16 sm:py-24 bg-white border-y border-[#E3E6DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#176B4D] font-sans">
              Intelligence Capabilities
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#163829] tracking-tight">
              Three Pillars of Market Visibility
            </h2>
            <p className="text-xs sm:text-sm text-[#4F5751] font-sans">
              Purpose-built for Philippine FMCG commercial and pricing leaders.
            </p>
          </div>

          {/* Feature 1: Price Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] text-xs font-bold uppercase tracking-wider font-sans">
                <Scale className="w-3.5 h-3.5 text-[#176B4D]" />
                <span>Price Intelligence</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#163829] tracking-tight">
                Know where every price sits.
              </h3>
              <p className="text-sm text-[#4F5751] leading-relaxed font-sans">
                Raw sticker prices hide actual consumer value. Standardizing prices to <strong>₱ per 100g</strong> reveals
                how brands truly position themselves, how package sizes scale, and which retailers command
                unjustified channel premiums.
              </p>
              <ul className="space-y-2.5 text-xs text-[#3B4840] font-sans">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span><strong>Unit Price Normalization (₱/100g):</strong> True apple-to-apple parity.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span><strong>Price Competitiveness Index (PCI):</strong> Normalized against category median.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span><strong>Promotion Dynamics:</strong> Deep discount tracking and regular vs promo spreads.</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onEnterApp('brand_architecture')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B4D] hover:underline pt-2 cursor-pointer font-sans"
              >
                <span>Inspect Brand Price Architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="lg:col-span-7 bg-[#FAFAF7] p-5 sm:p-6 rounded-xl border border-[#E3E6DF]">
              <div className="bg-white rounded-xl border border-[#E3E6DF] p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#EEF0EA] pb-2 text-xs">
                  <span className="font-bold text-[#163829] font-sans">Brand Price Index (Base 100 = Market Median)</span>
                  <span className="font-data text-[#176B4D] font-semibold">₱{kpis.medianPricePer100g.toFixed(2)}/100g Baseline</span>
                </div>
                <div className="space-y-2 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#163829]">Sensodyne (Sensitivity Specialist)</span>
                    <span className="font-data font-bold text-[#163829]">Index 198 (+98%)</span>
                  </div>
                  <div className="w-full bg-[#EEF0EA] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#176B4D] h-full rounded-full" style={{ width: '85%' }} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-medium text-[#163829]">Colgate (Category Benchmark)</span>
                    <span className="font-data font-bold text-[#163829]">Index 102 (+2%)</span>
                  </div>
                  <div className="w-full bg-[#EEF0EA] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#A8C5B4] h-full rounded-full" style={{ width: '51%' }} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-medium text-[#163829]">Hapee (Value Contender)</span>
                    <span className="font-data font-bold text-[#176B4D]">Index 58 (-42%)</span>
                  </div>
                  <div className="w-full bg-[#EEF0EA] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#176B4D]/40 h-full rounded-full" style={{ width: '29%' }} />
                  </div>
                </div>
                <div className="text-[10px] text-[#737A74] pt-2 border-t border-[#EEF0EA] font-sans">
                  Verified through 84 independent shelf observations in Philippine Modern Trade
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Competitive Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1 bg-[#FAFAF7] p-5 sm:p-6 rounded-xl border border-[#E3E6DF]">
              <div className="bg-white rounded-xl border border-[#E3E6DF] overflow-hidden shadow-2xs">
                <div className="p-3 bg-[#EEF4EE] text-[#163829] border-b border-[#DDEBE1] flex items-center justify-between text-xs font-sans">
                  <span className="font-bold">Identical SKU Cross-Retailer Dispersion</span>
                  <span className="text-[10px] text-[#737A74] font-data font-semibold">Matched SKUs</span>
                </div>
                <div className="p-3 divide-y divide-[#EEF0EA] text-xs font-sans">
                  {sampleCrossRetailer.map((sku, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#163829]">{sku.canonicalName}</div>
                        <div className="text-[10px] text-[#737A74]">
                          Cheapest: <strong className="text-[#176B4D]">{sku.cheapestRetailer}</strong> (₱{sku.minPrice.toFixed(2)})
                          {' '}• Priciest: <strong className="text-[#C04D44]">{sku.priciestRetailer}</strong> (₱{sku.maxPrice.toFixed(2)})
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-data font-bold bg-[#FDF4F3] text-[#C04D44] border border-[#F5C8C4]">
                          +{sku.percentageGap.toFixed(1)}% Gap
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1] text-xs font-bold uppercase tracking-wider font-sans">
                <Crosshair className="w-3.5 h-3.5 text-[#176B4D]" />
                <span>Competitive Intelligence</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#163829] tracking-tight">
                See the competitive landscape clearly.
              </h3>
              <p className="text-sm text-[#4F5751] leading-relaxed font-sans">
                Brand positioning is relative. THE GROCER constructs algorithmic competitive sets
                (Tier 1 Direct Competitors, Tier 2 Format Competitors, Tier 3 Substitutes) and quantifies
                identical SKU price dispersion across pharmacies, supermarkets, and digital stores.
              </p>
              <ul className="space-y-2.5 text-xs text-[#3B4840] font-sans">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span><strong>Identical SKU Matching:</strong> Strict matching on formula, brand, and gram size.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span><strong>Channel Dispersion:</strong> Quantifying inter-retailer spreads of up to 34%.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span><strong>Waterfall Decompositions:</strong> Base price vs promo vs channel adjustments.</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onEnterApp('competitive')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B4D] hover:underline pt-2 cursor-pointer font-sans"
              >
                <span>Launch Competitive Landscape</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Feature 3: Market Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5] text-xs font-bold uppercase tracking-wider font-sans">
                <TrendingUp className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Market Intelligence</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#163829] tracking-tight">
                Know what changed—and what deserves attention.
              </h3>
              <p className="text-sm text-[#4F5751] leading-relaxed font-sans">
                Commercial teams don&apos;t have time to inspect thousands of price points daily.
                THE GROCER continuously analyzes longitudinal price events, logs price volatility,
                and flags urgent investigation opportunities for immediate decision-making.
              </p>
              <ul className="space-y-2.5 text-xs text-[#3B4840] font-sans">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span><strong>Algorithmic Opportunity Engine:</strong> High-severity anomaly detection.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span><strong>Volatility Tracking:</strong> Log-return standard deviation across audit cycles.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span><strong>Audit Provenance:</strong> Every signal is supported by verifiable shelf records.</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onEnterApp('opportunities')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B4D] hover:underline pt-2 cursor-pointer font-sans"
              >
                <span>View Live Investigation Opportunities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="lg:col-span-7 bg-[#FAFAF7] p-5 sm:p-6 rounded-xl border border-[#E3E6DF]">
              <div className="bg-white rounded-xl border border-[#E3E6DF] p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#EEF0EA] pb-2 text-xs font-bold text-[#163829] font-sans">
                  <span>Active Investigation Signal Preview</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#FDF4F3] text-[#C04D44] border border-[#F5C8C4] font-data font-bold">
                    HIGH PRIORITY
                  </span>
                </div>
                <div className="text-xs space-y-1.5 font-sans">
                  <div className="font-bold text-[#163829]">
                    Retailer Channel Distortion: Mercury Drug vs SM Supermarket
                  </div>
                  <p className="text-[11px] text-[#4F5751] leading-relaxed">
                    Colgate Total 12 exhibits an 18.2% price premium at pharmacy retail channels versus
                    modern supermarket trade, threatening conversion volume.
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF] text-[10px] text-[#737A74] space-y-1">
                    <div><strong>Evidence:</strong> 3 verified observations on Sep 12, 2026.</div>
                    <div><strong>Commercial Impact:</strong> Potential price arbitrage and margin erosion.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. EXECUTIVE COMMAND CENTER SHOWCASE */}
      <section id="command-center" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-[#E3E6DF] p-8 sm:p-12 overflow-hidden relative shadow-card">
          <div className="max-w-2xl space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF4EE] border border-[#DDEBE1] text-[#176B4D] text-xs font-bold tracking-wider uppercase font-sans">
              <Activity className="w-3.5 h-3.5 text-[#176B4D]" />
              <span>Real-Time Cockpit</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-extrabold tracking-tight text-[#163829]">
              Your market, at a glance.
            </h2>
            <p className="text-sm sm:text-base text-[#4F5751] leading-relaxed font-sans">
              The Command Center synthesizes whole-market health, category median shifts, and actionable
              anomalies in one consolidated view. Built for rapid commercial briefings.
            </p>
          </div>

          {/* Interactive preview card */}
          <div className="bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#E3E6DF] shadow-2xs">
                <div className="text-[11px] font-sans text-[#737A74] uppercase font-bold">Category Median</div>
                <div className="text-2xl font-bold font-data text-[#163829] mt-1">₱{kpis.medianPricePer100g.toFixed(2)}</div>
                <div className="text-[10px] text-[#737A74] mt-1 font-sans">Per 100g standard</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E3E6DF] shadow-2xs">
                <div className="text-[11px] font-sans text-[#737A74] uppercase font-bold">Tracked SKUs</div>
                <div className="text-2xl font-bold font-data text-[#176B4D] mt-1">{kpis.totalProducts}</div>
                <div className="text-[10px] text-[#737A74] mt-1 font-sans">100% normalized</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E3E6DF] shadow-2xs">
                <div className="text-[11px] font-sans text-[#737A74] uppercase font-bold">Promotion Depth</div>
                <div className="text-2xl font-bold font-data text-[#B8860B] mt-1">{kpis.promotionRate}%</div>
                <div className="text-[10px] text-[#737A74] mt-1 font-sans">Avg promo {kpis.avgDiscountPercent}%</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E3E6DF] shadow-2xs">
                <div className="text-[11px] font-sans text-[#737A74] uppercase font-bold">Price Dispersion</div>
                <div className="text-2xl font-bold font-data text-[#163829] mt-1">₱{kpis.iqrPricePer100g.toFixed(1)}</div>
                <div className="text-[10px] text-[#737A74] mt-1 font-sans">Interquartile Range</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#EEF0EA]">
              <div className="text-xs text-[#4F5751] font-sans">
                Observing Philippine modern trade channels across Supermarkets, Pharmacies, and E-commerce.
              </div>
              <button
                type="button"
                onClick={() => onEnterApp('home')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#176B4D] text-white hover:bg-[#13583F] text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs font-sans"
              >
                <span>Launch Full Command Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS (The 6-Step Analytical Pipeline) */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-y border-[#E3E6DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-[#176B4D] font-sans">
              Analytical Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#163829] tracking-tight">
              The 6-Stage Analytical Pipeline
            </h2>
            <p className="text-sm text-[#4F5751] font-sans">
              How raw Philippine retail shelf prices become verified, defensible strategic intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#FAFAF7] border border-[#E3E6DF] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-data font-bold text-[#176B4D]">STEP 01</span>
                <Store className="w-5 h-5 text-[#737A74]" />
              </div>
              <h3 className="text-base font-bold text-[#163829]">COLLECT</h3>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Auditing shelf tags, promotional tags, regular prices, and digital catalog listings with
                complete timestamp and retailer metadata.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAFAF7] border border-[#E3E6DF] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-data font-bold text-[#176B4D]">STEP 02</span>
                <ShieldCheck className="w-5 h-5 text-[#176B4D]" />
              </div>
              <h3 className="text-base font-bold text-[#163829]">VALIDATE</h3>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Deterministic validation against package weight schemas, identity deduplication, and
                verification of regular vs promotional pricing.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAFAF7] border border-[#E3E6DF] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-data font-bold text-[#176B4D]">STEP 03</span>
                <Scale className="w-5 h-5 text-[#176B4D]" />
              </div>
              <h3 className="text-base font-bold text-[#163829]">NORMALIZE</h3>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Conversion to standardized unit economics (₱/100g or ₱/100ml) ensuring multipacks and
                diverse package formats are compared accurately.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAFAF7] border border-[#E3E6DF] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-data font-bold text-[#176B4D]">STEP 04</span>
                <BarChart3 className="w-5 h-5 text-[#176B4D]" />
              </div>
              <h3 className="text-base font-bold text-[#163829]">ANALYZE</h3>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Calculating statistical medians, Student&apos;s t confidence intervals, interquartile ranges,
                and multivariate hedonic price regressions.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAFAF7] border border-[#E3E6DF] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-data font-bold text-[#176B4D]">STEP 05</span>
                <Activity className="w-5 h-5 text-[#B8860B]" />
              </div>
              <h3 className="text-base font-bold text-[#163829]">DETECT</h3>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Algorithmic detection of competitive price breaches, channel dispersion anomalies, and
                promotional margin compression.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAFAF7] border border-[#E3E6DF] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-data font-bold text-[#176B4D]">STEP 06</span>
                <ExternalLink className="w-5 h-5 text-[#163829]" />
              </div>
              <h3 className="text-base font-bold text-[#163829]">INVESTIGATE</h3>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Generating structured commercial investigation cards with underlying retail audit records
                ready for category review meetings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. WHO IT IS FOR */}
      <section id="for-business" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-[#176B4D] font-sans">
            Enterprise Solutions
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#163829] tracking-tight">
            Built for Commercial Decision Makers
          </h2>
          <p className="text-sm text-[#4F5751] font-sans">
            Tailored workflows for key functional leaders in consumer goods and retail.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Persona 1 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-[#EEF4EE] border border-[#DDEBE1] flex items-center justify-center text-[#176B4D]">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#163829]">Pricing &amp; Revenue Management</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Verify compliance with recommended retail prices (RRP), track pack-size curves, and benchmark
              price elasticity across competing brands.
            </p>
          </div>

          {/* Persona 2 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-[#EEF4EE] border border-[#DDEBE1] flex items-center justify-center text-[#176B4D]">
              <Store className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#163829]">Category Management</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Map shelf share versus unit price positioning, identify under-served price tiers, and negotiate
              shelf placements with objective data.
            </p>
          </div>

          {/* Persona 3 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-[#EEF4EE] border border-[#DDEBE1] flex items-center justify-center text-[#176B4D]">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#163829]">Brand Management</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Defend brand premium equity against aggressive price fighting, track competitive sets, and monitor
              competitor promotional intensity.
            </p>
          </div>

          {/* Persona 4 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-[#FFFDF5] border border-[#FEEBB5] flex items-center justify-center text-[#B8860B]">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#163829]">Trade Marketing</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Evaluate retailer compliance on joint business plans, track promotional frequency, and uncover
              unauthorized channel price dumping.
            </p>
          </div>

          {/* Persona 5 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-[#EEF4EE] border border-[#DDEBE1] flex items-center justify-center text-[#176B4D]">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#163829]">Market Intelligence &amp; Strategy</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Produce executive-ready briefings on inflation pass-through, quarterly margin dynamics, and
              market-wide price volatility.
            </p>
          </div>

          {/* Persona 6 */}
          <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] space-y-3 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-[#EEF4EE] border border-[#DDEBE1] flex items-center justify-center text-[#176B4D]">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#163829]">Executive Leadership</h3>
            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              Consolidated category intelligence cockpits providing macro visibility into retail trends without
              relying on stale, delayed panel surveys.
            </p>
          </div>
        </div>
      </section>

      {/* 9. DATA TRUST / METHODOLOGY */}
      <section id="methodology" className="py-16 sm:py-24 bg-white border-y border-[#E3E6DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#176B4D] font-sans">
              Methodological Rigor
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#163829] tracking-tight">
              Intelligence you can trace.
            </h2>
            <p className="text-sm text-[#4F5751] leading-relaxed font-sans">
              The platform does not hide uncertainty behind polished dashboards. Every visual, index, and
              opportunity is explicitly tagged with its evidentiary origin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-[#DDEBE1] bg-[#EEF4EE]/60 space-y-2 shadow-2xs">
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-data font-bold bg-[#DDEBE1] text-[#176B4D]">
                [OBSERVED]
              </div>
              <h4 className="text-sm font-bold text-[#163829] font-sans">Audited Shelf Prices</h4>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Directly collected price tags, barcode records, and retailer receipts. Ground truth data with
                traceable dates.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#DDEBE1] bg-[#F4F5EF] space-y-2 shadow-2xs">
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-data font-bold bg-[#E3E6DF] text-[#163829]">
                [DERIVED]
              </div>
              <h4 className="text-sm font-bold text-[#163829] font-sans">Normalized Unit Costs</h4>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Standardized ₱/100g values, Price Competitiveness Indices (PCI), and Relative Price Positions (RPP).
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#E3E6DF] bg-[#FAFAF7] space-y-2 shadow-2xs">
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-data font-bold bg-[#EEF0EA] text-[#3B4840]">
                [ESTIMATED]
              </div>
              <h4 className="text-sm font-bold text-[#163829] font-sans">Econometric Regressions</h4>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Hedonic regressions, pack-size economies of scale, and Student&apos;s t confidence bounds with reported
                diagnostics.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#FEEBB5] bg-[#FFFDF5] space-y-2 shadow-2xs">
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-data font-bold bg-[#FEF3D6] text-[#B8860B]">
                [INFERRED]
              </div>
              <h4 className="text-sm font-bold text-[#163829] font-sans">Competitive Peer Sets</h4>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Algorithmic direct and substitute groupings established via deterministic multi-attribute similarity
                criteria.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E3E6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#163829] font-sans">
                Audit Transparency Guarantee
              </div>
              <p className="text-xs text-[#737A74] font-sans">
                Review the complete mathematical methodology, data quality scores, and regression diagnostics.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEnterApp('methodology')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#176B4D] bg-white border border-[#E3E6DF] hover:bg-[#EEF4EE] rounded-xl transition-colors shadow-2xs shrink-0 cursor-pointer font-sans"
            >
              <span>View Methodology &amp; Quality Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-20 sm:py-28 bg-[#F4F5EF] border-t border-[#E3E6DF] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEF4EE] border border-[#DDEBE1] text-[#176B4D] text-xs font-bold uppercase tracking-wider font-sans">
            <span>Philippine Retail Market Intelligence</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-extrabold text-[#163829] tracking-tight leading-tight">
            Read the market, <br className="hidden sm:inline" />
            <span className="text-[#176B4D]">one shelf at a time.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#4F5751] max-w-xl mx-auto leading-relaxed font-sans">
            Turn fragmented retail observations into a clearer view of price, competition, and market movement.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => onEnterApp('home')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold text-white bg-[#176B4D] hover:bg-[#13583F] rounded-xl transition-all shadow-card cursor-pointer font-sans"
            >
              <span>Explore THE GROCER</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('methodology')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold text-[#163829] hover:text-[#176B4D] bg-white hover:bg-[#EEF4EE] border border-[#E3E6DF] rounded-xl transition-colors cursor-pointer font-sans"
            >
              <span>View Methodology</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11. INSTITUTIONAL PUBLIC FOOTER */}
      <footer className="bg-white border-t border-[#E3E6DF] py-12 text-xs text-[#737A74]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TheGrocerLogo size="sm" />
              </div>
              <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
                Philippine Retail Market Intelligence. Transforming modern trade price observations into
                structured commercial insights.
              </p>
              <div className="text-[11px] font-data text-[#737A74]">
                Metro Manila Audit • FMCG Category
              </div>
            </div>

            {/* Platform Modules */}
            <div className="space-y-2.5 font-sans">
              <div className="font-bold text-[#163829] uppercase tracking-wider text-[11px]">
                Platform Modules
              </div>
              <ul className="space-y-1.5 text-xs text-[#4F5751]">
                <li>
                  <button
                    type="button"
                    onClick={() => onEnterApp('home')}
                    className="hover:text-[#176B4D] transition-colors"
                  >
                    Command Center
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnterApp('overview')}
                    className="hover:text-[#176B4D] transition-colors"
                  >
                    Market Overview
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnterApp('competitive')}
                    className="hover:text-[#176B4D] transition-colors"
                  >
                    Competitive Landscape
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnterApp('opportunities')}
                    className="hover:text-[#176B4D] transition-colors"
                  >
                    Investigation Opportunities
                  </button>
                </li>
              </ul>
            </div>

            {/* Architecture & Economics */}
            <div className="space-y-2.5 font-sans">
              <div className="font-bold text-[#163829] uppercase tracking-wider text-[11px]">
                Price Architecture
              </div>
              <ul className="space-y-1.5 text-xs text-[#4F5751]">
                <li>
                  <button
                    type="button"
                    onClick={() => onEnterApp('brand_architecture')}
                    className="hover:text-[#176B4D] transition-colors"
                  >
                    Brand Price Architecture
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnterApp('channel_architecture')}
                    className="hover:text-[#176B4D] transition-colors"
                  >
                    Channel Dispersion Waterfall
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnterApp('economics')}
                    className="hover:text-[#176B4D] transition-colors"
                  >
                    Hedonic Econometrics
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnterApp('methodology')}
                    className="hover:text-[#176B4D] transition-colors"
                  >
                    Data Provenance &amp; Audit
                  </button>
                </li>
              </ul>
            </div>

            {/* Verification Notice */}
            <div className="space-y-2.5 font-sans">
              <div className="font-bold text-[#163829] uppercase tracking-wider text-[11px]">
                Audited Banners
              </div>
              <p className="text-xs text-[#4F5751] leading-relaxed">
                SM Supermarket, Robinsons Supermarket, Puregold, Watson&apos;s Personal Care Stores, Mercury Drug,
                Southstar Drug, WalterMart.
              </p>
              <div className="pt-2 text-[11px] text-[#737A74] font-data">
                All price observations reflect listed consumer shelf prices in Philippine Pesos (PHP).
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#EEF0EA] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#737A74] font-sans">
            <div>
              &copy; {new Date().getFullYear()} THE GROCER. All rights reserved. Built for Philippine Retail Market Intelligence.
            </div>
            <div className="flex items-center gap-4">
              <span className="font-data font-semibold">Base 100 = ₱{kpis.medianPricePer100g.toFixed(2)}/100g</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => onEnterApp('methodology')}
                className="hover:text-[#176B4D] transition-colors"
              >
                Methodology &amp; Disclaimers
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Sign In Modal */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#163829]/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E3E6DF] max-w-md w-full p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF0EA] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#176B4D]" />
                <h3 className="text-sm font-bold text-[#163829] font-sans">Enterprise Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSignInModalOpen(false)}
                className="text-xs text-[#737A74] hover:text-[#163829] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#4F5751] leading-relaxed font-sans">
              THE GROCER provides enterprise commercial intelligence for FMCG brands and retail commercial
              teams in the Philippines.
            </p>

            <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl text-xs space-y-1.5 font-data text-[#163829]">
              <div className="text-[10px] text-[#737A74] uppercase font-bold">Instant Demo Environment:</div>
              <div>Tenant: <strong>fmcg-ph-demo</strong></div>
              <div>Role: <strong>Commercial Director (All Access)</strong></div>
              <div>Category: <strong>Oral Care (Toothpaste)</strong></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSignInModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#737A74] hover:text-[#163829] font-sans cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignInModalOpen(false);
                  onEnterApp('home');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#176B4D] hover:bg-[#13583F] rounded-xl transition-all shadow-xs font-sans cursor-pointer"
              >
                Enter Demo Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
