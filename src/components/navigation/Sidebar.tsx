import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Search,
  Scale,
  Layers,
  Store,
  TrendingUp,
  LineChart,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  X,
  Award,
  Crosshair,
  Building2,
  Network,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { TabType } from '../../types';
import { TheGrocerLogo } from '../common/TheGrocerLogo';

export interface NavItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  compareCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  compareCount = 0,
  isMobileOpen = false,
  onCloseMobile = () => {},
  isCollapsed,
  onToggleCollapsed
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    market: true,
    product: true,
    brand: true,
    retailer: true,
    decisions: true,
    data: true
  });

  const toggleSection = (secId: string) => {
    setOpenSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Structured per user prompt specifications
  const sections: NavSection[] = [
    {
      id: 'market',
      title: 'MARKET',
      items: [
        { id: 'overview', label: 'Market Overview', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'home', label: 'Executive Summary', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'competitive', label: 'Competitive Landscape', icon: <Crosshair className="w-4 h-4" /> },
        { id: 'trends', label: 'Price Trends', icon: <TrendingUp className="w-4 h-4" /> }
      ]
    },
    {
      id: 'product',
      title: 'PRODUCT INTELLIGENCE',
      items: [
        { id: 'explorer', label: 'Price Explorer', icon: <Search className="w-4 h-4" /> },
        {
          id: 'compare',
          label: 'Product Comparison',
          icon: <Scale className="w-4 h-4" />,
          badge: compareCount > 0 ? compareCount : undefined
        },
        { id: 'positioning', label: 'Positioning Matrix', icon: <Layers className="w-4 h-4" /> }
      ]
    },
    {
      id: 'brand',
      title: 'BRAND INTELLIGENCE',
      items: [
        { id: 'brands', label: 'Brand Analysis', icon: <Award className="w-4 h-4" /> },
        { id: 'brand_architecture', label: 'Brand Price Architecture', icon: <Building2 className="w-4 h-4" /> }
      ]
    },
    {
      id: 'retailer',
      title: 'RETAILER INTELLIGENCE',
      items: [
        { id: 'retailers', label: 'Retailer Analysis', icon: <Store className="w-4 h-4" /> },
        { id: 'channel_architecture', label: 'Channel Price Architecture', icon: <Network className="w-4 h-4" /> }
      ]
    },
    {
      id: 'decisions',
      title: 'DECISIONS',
      items: [
        { id: 'opportunities', label: 'Investigation Opportunities', icon: <Lightbulb className="w-4 h-4" /> }
      ]
    },
    {
      id: 'data',
      title: 'DATA & METHODS',
      items: [
        { id: 'economics', label: 'Economic Analysis', icon: <LineChart className="w-4 h-4" /> },
        { id: 'methodology', label: 'Data & Methodology', icon: <ShieldCheck className="w-4 h-4" /> }
      ]
    }
  ];

  const handleItemClick = (tabId: TabType) => {
    onSelectTab(tabId);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const renderNavContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full select-none bg-white text-[#163829]">
      {/* Brand Header */}
      <div
        className={`border-b border-[#E3E6DF] shrink-0 transition-all duration-200 ${
          collapsed ? 'py-4 px-2 flex flex-col items-center' : 'p-4'
        }`}
      >
        {collapsed ? (
          <div className="relative group/logo">
            <button
              type="button"
              onClick={() => handleItemClick('home')}
              className="w-10 h-10 rounded-xl bg-white border border-[#E3E6DF] flex flex-col items-center justify-center hover:bg-[#EEF4EE] hover:border-[#A8C5B4] transition-all cursor-pointer shadow-xs"
              title="THE GROCER — Philippine Retail Market Intelligence"
            >
              <TheGrocerLogo variant="brand" size={20} showWordmark={false} />
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover/logo:block whitespace-nowrap px-3 py-2 bg-white text-[#163829] border border-[#E3E6DF] rounded-lg text-xs font-medium shadow-floating pointer-events-none font-sans">
              <div className="font-bold tracking-tight text-[#163829]">THE GROCER</div>
              <div className="text-[10px] text-[#737A74] font-sans">
                Philippine Retail Market Intelligence
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleItemClick('home')}
              className="flex items-center text-left group w-full cursor-pointer hover:opacity-95 transition-opacity"
            >
              <TheGrocerLogo
                variant="brand"
                size={26}
                showWordmark={true}
                subtitle="Philippine Retail Intelligence"
              />
            </button>

            {/* Scope Pill */}
            <div className="px-2.5 py-1.5 rounded-lg bg-[#FAFAF7] border border-[#E3E6DF] text-[10px] font-sans text-[#737A74] flex items-center justify-between">
              <span className="uppercase tracking-wider font-bold text-[#163829]">PH FMCG</span>
              <span className="text-[#176B4D] font-semibold truncate">Oral Care / Toothpaste</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3 scrollbar-none">
        {sections.map((section, idx) => {
          const isOpen = openSections[section.id] ?? true;

          return (
            <div key={section.id} className="space-y-0.5">
              {/* Section Header */}
              {collapsed ? (
                idx > 0 ? (
                  <div className="h-px bg-[#E3E6DF] mx-2 my-2" />
                ) : null
              ) : (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#737A74] hover:text-[#163829] transition-colors group cursor-pointer"
                >
                  <span className="font-sans">{section.title}</span>
                  <span className="text-[#737A74] group-hover:text-[#163829]">
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                </button>
              )}

              {/* Section Items */}
              {(!collapsed && !isOpen) ? null : (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = currentTab === item.id;

                    if (collapsed) {
                      return (
                        <div key={item.id} className="relative group">
                          <button
                            id={`sidebar-collapsed-nav-${item.id}`}
                            type="button"
                            onClick={() => handleItemClick(item.id)}
                            className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#EAF4ED] text-[#176B4D] border border-[#DDEBE1] shadow-xs'
                                : 'text-[#5F625D] hover:bg-[#EEF4EE] hover:text-[#176B4D]'
                            }`}
                            aria-label={item.label}
                          >
                            {item.icon}
                            {item.badge !== undefined && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#176B4D]" />
                            )}
                          </button>

                          {/* Floating Tooltip in Collapsed Mode */}
                          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:block whitespace-nowrap px-3 py-1.5 bg-white text-[#163829] border border-[#E3E6DF] rounded-lg text-xs font-medium shadow-floating pointer-events-none font-sans">
                            <div className="flex items-center gap-2">
                              <span>{item.label}</span>
                              {item.badge !== undefined && (
                                <span className="bg-[#176B4D] text-white text-[10px] px-1.5 py-0.2 rounded font-data font-semibold">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        id={`sidebar-nav-${item.id}`}
                        type="button"
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#EAF4ED] text-[#176B4D] font-semibold border border-[#DDEBE1] shadow-xs'
                            : 'text-[#5F625D] hover:bg-[#EEF4EE] hover:text-[#176B4D] font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={isActive ? 'text-[#176B4D]' : 'text-[#737A74]'}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-data px-1.5 py-0.2 rounded font-semibold tabular-nums ${
                              isActive
                                ? 'bg-[#176B4D] text-white'
                                : 'bg-[#E8E7DF] text-[#4F5751]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Utility Indicator */}
      <div className="border-t border-[#E3E6DF] p-3 shrink-0 bg-[#FAFAF7]">
        {!collapsed && (
          <button
            type="button"
            onClick={() => onSelectTab('landing')}
            className="w-full mb-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-[#4F5751] hover:text-[#176B4D] hover:bg-white hover:border-[#E3E6DF] border border-transparent transition-all shadow-none hover:shadow-xs cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#176B4D]" />
              <span className="font-medium">Public Overview</span>
            </span>
            <span className="text-[10px] text-[#737A74]">&rarr;</span>
          </button>
        )}
        {collapsed ? (
          <div className="flex justify-center" title="Sentinel Active">
            <span className="w-2 h-2 rounded-full bg-[#176B4D]" />
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-[#737A74] font-sans px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#176B4D]" />
              <span className="text-[#4F5751]">Sentinel Active</span>
            </div>
            <span className="text-[10px] text-[#737A74] font-data">v2.5</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Collapsible Sidebar */}
      <aside
        id="desktop-sidebar"
        className={`hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 bg-white border-r border-[#E3E6DF] transition-[width] duration-200 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-[264px]'
        }`}
      >
        {/* Edge-mounted Expand / Collapse Toggle Control */}
        <button
          id="sidebar-toggle-btn"
          type="button"
          onClick={onToggleCollapsed}
          className="absolute -right-3.5 top-5 z-50 w-7 h-7 bg-white border border-[#E3E6DF] text-[#737A74] hover:text-[#163829] hover:bg-[#EEF4EE] rounded-lg shadow-card flex items-center justify-center transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftClose className="w-3.5 h-3.5" />
          )}
        </button>

        {renderNavContent(isCollapsed)}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#163829]/20 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          <div className="relative w-[280px] max-w-[85vw] h-full bg-white border-r border-[#E3E6DF] shadow-floating flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={onCloseMobile}
              className="absolute right-3 top-4 text-[#737A74] hover:text-[#163829] p-1.5 rounded-md transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            {renderNavContent(false)}
          </div>
        </div>
      )}
    </>
  );
};
