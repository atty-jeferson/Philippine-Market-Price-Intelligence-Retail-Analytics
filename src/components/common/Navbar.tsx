import React from 'react';
import {
  Sparkles,
  BarChart3,
  Sliders,
  Scale,
  Search,
  Layers,
  Store,
  TrendingUp,
  FileSpreadsheet,
  HelpCircle,
  ShoppingBag,
  GraduationCap,
  Briefcase,
  Home,
  Check
} from 'lucide-react';
import { TabType, PersonaMode } from '../../types';

interface NavbarProps {
  currentTab: TabType;
  onTabChange?: (tab: TabType) => void;
  onSelectTab?: (tab: TabType) => void;
  personaMode?: PersonaMode;
  persona?: PersonaMode;
  onPersonaChange?: (mode: PersonaMode) => void;
  onChangePersona?: (mode: PersonaMode) => void;
  isDemoData?: boolean;
  onOpenScoreConfig?: () => void;
  onOpenValueModel?: () => void;
  comparisonCount?: number;
  compareCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onSelectTab,
  personaMode,
  persona,
  onPersonaChange,
  onChangePersona,
  isDemoData = true,
  onOpenScoreConfig,
  onOpenValueModel,
  comparisonCount,
  compareCount
}) => {
  const handleTab = (tab: TabType) => {
    if (onSelectTab) onSelectTab(tab);
    else if (onTabChange) onTabChange(tab);
  };
  const currentPersona = persona || personaMode || 'shopper';
  const handlePersona = (p: PersonaMode) => {
    if (onChangePersona) onChangePersona(p);
    else if (onPersonaChange) onPersonaChange(p);
  };
  const handleOpenConfig = onOpenValueModel || onOpenScoreConfig || (() => {});
  const totalCompare = compareCount ?? comparisonCount ?? 0;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'overview', label: 'Market Overview', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'explorer', label: 'Price Explorer', icon: <Search className="w-3.5 h-3.5" /> },
    {
      id: 'compare',
      label: `Compare${totalCompare > 0 ? ` (${totalCompare})` : ''}`,
      icon: <Scale className="w-3.5 h-3.5" />
    },
    { id: 'brands', label: 'Brand Analysis', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'retailers', label: 'Retailer Analysis', icon: <Store className="w-3.5 h-3.5" /> },
    { id: 'positioning', label: 'Positioning Matrix', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'trends', label: 'Price Trends', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'economics', label: 'Economic Analysis', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'methodology', label: 'Data & Methodology', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D9E2EC]">
      {/* Top Banner: Demo Label & Persona Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 border-b border-[#D9E2EC]/60 text-xs gap-4 flex-wrap">
          {/* Brand & Demo Tag */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              type="button"
              onClick={() => handleTab('home')}
              className="flex items-center gap-2.5 group transition-opacity"
            >
              <div className="w-7 h-7 border border-[#1D5FA7] flex items-center justify-center rotate-45 bg-[#EAF3FB] group-hover:bg-[#1D5FA7] group-hover:text-white transition-colors">
                <div className="-rotate-45 text-[#1D5FA7] group-hover:text-white font-mono font-bold text-xs">₱</div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg tracking-[0.12em] text-[#0B1F3A] font-semibold">TOOTHPRICE</span>
                <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[#1D5FA7]">PH</span>
              </div>
            </button>
            <span className="hidden sm:inline text-[#D9E2EC]">|</span>
            <span className="hidden sm:inline text-[#667085] text-[10px] uppercase tracking-[0.18em] font-medium">
              Pricing Intelligence & Unit Economics
            </span>

            {isDemoData ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#EAF3FB] text-[#1D5FA7] border border-[#D9E2EC]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D5FA7] animate-pulse"></span>
                Benchmark Data
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-50 text-[#16845B] border border-emerald-200">
                <Check className="w-3 h-3 text-[#16845B]" />
                Custom Dataset
              </span>
            )}
          </div>

          {/* Persona Switcher & Config */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Persona Switcher */}
            <div className="flex items-center bg-[#F7F9FC] p-0.5 rounded border border-[#D9E2EC] text-xs">
              <button
                id="persona-shopper-btn"
                type="button"
                onClick={() => handlePersona('shopper')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] uppercase tracking-wider font-medium transition-all ${
                  currentPersona === 'shopper'
                    ? 'bg-[#1D5FA7] text-white font-semibold'
                    : 'text-[#667085] hover:text-[#172B4D] hover:bg-[#EAF3FB]'
                }`}
                title="Shopper Mode: Focus on best unit prices and consumer savings"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Shopper</span>
              </button>

              <button
                id="persona-analyst-btn"
                type="button"
                onClick={() => handlePersona('analyst')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] uppercase tracking-wider font-medium transition-all ${
                  currentPersona === 'analyst'
                    ? 'bg-[#1D5FA7] text-white font-semibold'
                    : 'text-[#667085] hover:text-[#172B4D] hover:bg-[#EAF3FB]'
                }`}
                title="Business Analyst Mode: Focus on brand premiums and positioning"
              >
                <Briefcase className="w-3 h-3" />
                <span>Analyst</span>
              </button>

              <button
                id="persona-researcher-btn"
                type="button"
                onClick={() => handlePersona('researcher')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] uppercase tracking-wider font-medium transition-all ${
                  currentPersona === 'researcher'
                    ? 'bg-[#1D5FA7] text-white font-semibold'
                    : 'text-[#667085] hover:text-[#172B4D] hover:bg-[#EAF3FB]'
                }`}
                title="Researcher Mode: Focus on econometrics, regressions, and dispersion"
              >
                <GraduationCap className="w-3 h-3" />
                <span>Researcher</span>
              </button>
            </div>

            {/* Value Score Weights Modal Trigger */}
            <button
              id="open-score-weights-btn"
              type="button"
              onClick={handleOpenConfig}
              className="flex items-center gap-1.5 text-[#172B4D] bg-white hover:bg-[#EAF3FB] hover:text-[#1D5FA7] border border-[#D9E2EC] px-3 py-1 rounded text-xs transition-colors"
              title="Adjust Value Score weights"
            >
              <Sliders className="w-3 h-3 text-[#1D5FA7]" />
              <span className="hidden md:inline uppercase tracking-wider text-[10px] font-medium">Model Weights</span>
            </button>
          </div>
        </div>

        {/* Primary Tab Navigation */}
        <nav
          id="main-nav-tabs"
          className="flex items-center space-x-1 py-1 overflow-x-auto scrollbar-none text-xs"
        >
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                onClick={() => handleTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded whitespace-nowrap text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#EAF3FB] text-[#1D5FA7] border-b-2 border-[#1D5FA7] font-semibold'
                    : 'text-[#667085] hover:text-[#172B4D] hover:bg-[#EAF3FB]'
                }`}
              >
                <span className={isActive ? 'text-[#1D5FA7]' : 'text-[#667085]'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
