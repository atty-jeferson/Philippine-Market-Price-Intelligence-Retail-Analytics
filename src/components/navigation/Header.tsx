import React from 'react';
import {
  Menu,
  ChevronRight,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  Sliders,
  Scale,
  Check,
  ExternalLink
} from 'lucide-react';
import { TabType, PersonaMode } from '../../types';

interface HeaderProps {
  currentTab: TabType;
  onOpenMobileNav: () => void;
  persona: PersonaMode;
  onChangePersona: (mode: PersonaMode) => void;
  onOpenScoreConfig: () => void;
  compareCount: number;
  onNavigateToCompare: () => void;
  onNavigateToLanding?: () => void;
  isDemoData?: boolean;
}

// Map each tab to its section name and page title for breadcrumb
const TAB_BREADCRUMBS: Record<TabType, { section: string; title: string }> = {
  landing: { section: 'PLATFORM', title: 'Public Overview' },
  home: { section: 'MARKET', title: 'Executive Summary' },
  overview: { section: 'MARKET', title: 'Market Overview' },
  competitive: { section: 'MARKET', title: 'Competitive Landscape' },
  trends: { section: 'MARKET', title: 'Price Trends' },
  explorer: { section: 'PRODUCT INTELLIGENCE', title: 'Price Explorer' },
  compare: { section: 'PRODUCT INTELLIGENCE', title: 'Product Comparison' },
  positioning: { section: 'PRODUCT INTELLIGENCE', title: 'Positioning Matrix' },
  brands: { section: 'BRAND INTELLIGENCE', title: 'Brand Analysis' },
  brand_architecture: { section: 'BRAND INTELLIGENCE', title: 'Brand Price Architecture' },
  retailers: { section: 'RETAILER INTELLIGENCE', title: 'Retailer Analysis' },
  channel_architecture: { section: 'RETAILER INTELLIGENCE', title: 'Channel Price Architecture' },
  economics: { section: 'DATA & METHODS', title: 'Economic Analysis' },
  opportunities: { section: 'DECISIONS', title: 'Investigation Opportunities' },
  methodology: { section: 'DATA & METHODS', title: 'Data & Methodology' }
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileNav,
  persona,
  onChangePersona,
  onOpenScoreConfig,
  compareCount,
  onNavigateToCompare,
  onNavigateToLanding,
  isDemoData = true
}) => {
  const breadcrumb = TAB_BREADCRUMBS[currentTab] || {
    section: 'MARKET',
    title: 'Executive Summary'
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E3E6DF] transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        {/* Left Section: Mobile Menu + Breadcrumbs + Category Scope */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            id="mobile-menu-toggle-btn"
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden p-1.5 rounded-lg text-[#163829] hover:bg-[#EEF4EE] border border-[#E3E6DF] transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4 text-[#163829]" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-sans font-semibold text-[#737A74]">
              {breadcrumb.section}
            </span>
            <ChevronRight className="w-3 h-3 text-[#A8C5B4]" />
            <h2 className="text-[14px] font-bold text-[#163829] leading-none font-sans">
              {breadcrumb.title}
            </h2>
          </div>

          <span className="hidden lg:inline text-[#E3E6DF]">|</span>

          {/* Professional Research Scope Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#FAFAF7] text-[#737A74] border border-[#E3E6DF]">
            <span>PHILIPPINES</span>
            <span className="text-[#E3E6DF]">/</span>
            <span>FMCG</span>
            <span className="text-[#E3E6DF]">/</span>
            <span>ORAL CARE</span>
            <span className="text-[#E3E6DF]">/</span>
            <span className="text-[#176B4D] font-bold">TOOTHPASTE</span>
          </div>
        </div>

        {/* Right Section: Dataset Status, Compare, Persona Switcher & Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Dataset Status Badge */}
          {isDemoData ? (
            <div
              className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-1 rounded-lg bg-[#FFFDF5] text-[#B8860B] border border-[#F4E8B8]"
              title="Demo Dataset: Curated historical shelf observations"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C27D22]" />
              <span>DEMO DATA</span>
            </div>
          ) : (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-1 rounded-lg bg-[#EAF4ED] text-[#176B4D] border border-[#DDEBE1]"
              title="Verified Custom Dataset Uploaded"
            >
              <Check className="w-3 h-3 text-[#176B4D]" />
              VERIFIED DATA
            </span>
          )}

          {/* Compare shortcut pill */}
          {compareCount > 0 && (
            <button
              id="header-compare-pill"
              type="button"
              onClick={onNavigateToCompare}
              className="flex items-center gap-1.5 bg-[#EAF4ED] hover:bg-[#DDEBE1] text-[#176B4D] border border-[#A8C5B4] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs font-sans"
              title="View selected products in comparison tray"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare ({compareCount})</span>
            </button>
          )}

          {/* Persona Switcher (Clean Segmented Control) */}
          <div className="flex items-center bg-[#FAFAF7] p-0.5 rounded-lg border border-[#E3E6DF] text-xs">
            <button
              id="persona-shopper-btn"
              type="button"
              onClick={() => onChangePersona('shopper')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-all cursor-pointer ${
                persona === 'shopper'
                  ? 'bg-white text-[#163829] shadow-xs border border-[#E3E6DF] font-semibold'
                  : 'text-[#737A74] hover:text-[#163829]'
              }`}
              title="Shopper Mode: Focus on best unit prices and consumer savings"
            >
              <ShoppingBag className="w-3 h-3" />
              <span className="hidden sm:inline">Shopper</span>
            </button>

            <button
              id="persona-analyst-btn"
              type="button"
              onClick={() => onChangePersona('analyst')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-all cursor-pointer ${
                persona === 'analyst'
                  ? 'bg-white text-[#163829] shadow-xs border border-[#E3E6DF] font-semibold'
                  : 'text-[#737A74] hover:text-[#163829]'
              }`}
              title="Analyst Mode: Focus on brand premiums and category margins"
            >
              <Briefcase className="w-3 h-3" />
              <span className="hidden sm:inline">Analyst</span>
            </button>

            <button
              id="persona-researcher-btn"
              type="button"
              onClick={() => onChangePersona('researcher')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-all cursor-pointer ${
                persona === 'researcher'
                  ? 'bg-white text-[#163829] shadow-xs border border-[#E3E6DF] font-semibold'
                  : 'text-[#737A74] hover:text-[#163829]'
              }`}
              title="Researcher Mode: Focus on econometrics, regressions, and dispersion"
            >
              <GraduationCap className="w-3 h-3" />
              <span className="hidden sm:inline">Researcher</span>
            </button>
          </div>

          {/* Model Weights Config Trigger */}
          <button
            id="open-score-weights-btn"
            type="button"
            onClick={onOpenScoreConfig}
            className="flex items-center gap-1.5 text-[#163829] bg-white hover:bg-[#EEF4EE] border border-[#E3E6DF] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs font-sans"
            title="Adjust Value Score model weights"
          >
            <Sliders className="w-3.5 h-3.5 text-[#737A74]" />
            <span className="hidden xl:inline text-[11px] font-medium text-[#4F5751]">
              Weights
            </span>
          </button>

          {/* Landing Page Showcase Trigger */}
          {onNavigateToLanding && (
            <button
              id="open-landing-overview-btn"
              type="button"
              onClick={onNavigateToLanding}
              className="flex items-center gap-1.5 text-[#163829] bg-white hover:bg-[#EEF4EE] border border-[#E3E6DF] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs font-sans"
              title="View Public Overview & Platform Showcase"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#737A74]" />
              <span className="hidden sm:inline text-[11px] font-medium text-[#4F5751]">
                Overview
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
