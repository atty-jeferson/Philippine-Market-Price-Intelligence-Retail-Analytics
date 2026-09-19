import React, { useState, useMemo } from 'react';
import {
  TabType,
  UserPersona,
  NormalizedProduct,
  ToothpasteProduct,
  ValueWeights
} from './types';
import { DEFAULT_TOOTHPASTES } from './data/sampleToothpastes';
import {
  normalizeProducts,
  calculateMarketSummaryKPIs,
  calculateBrandMetrics,
  calculateRetailerMetrics,
  calculateCrossRetailerSKUs,
  DEFAULT_VALUE_WEIGHTS
} from './utils/calculations';

// Common Components
import { Sidebar } from './components/navigation/Sidebar';
import { Header } from './components/navigation/Header';
import { ProductDetailModal } from './components/common/ProductDetailModal';
import { ValueScoreModal } from './components/common/ValueScoreModal';

// Tab Components
import { LandingPage } from './components/landing/LandingPage';
import { HeroHome } from './components/home/HeroHome';
import { MarketOverviewTab } from './components/tabs/MarketOverviewTab';
import { PriceExplorerTab } from './components/tabs/PriceExplorerTab';
import { ProductComparisonTab } from './components/tabs/ProductComparisonTab';
import { BrandAnalysisTab } from './components/tabs/BrandAnalysisTab';
import { RetailerAnalysisTab } from './components/tabs/RetailerAnalysisTab';
import { ProductPositioningTab } from './components/tabs/ProductPositioningTab';
import { PriceTrendsTab } from './components/tabs/PriceTrendsTab';
import { EconomicAnalysisTab } from './components/tabs/EconomicAnalysisTab';
import { DataMethodologyTab } from './components/tabs/DataMethodologyTab';
import { CompetitiveLandscapeTab } from './components/tabs/CompetitiveLandscapeTab';
import { BrandPriceArchitectureTab } from './components/tabs/BrandPriceArchitectureTab';
import { ChannelPriceArchitectureTab } from './components/tabs/ChannelPriceArchitectureTab';
import { OpportunitiesTab } from './components/tabs/OpportunitiesTab';
import { detectInvestigationOpportunities } from './domain/opportunities';

export default function App() {
  // Navigation & Persona State
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [persona, setPersona] = useState<UserPersona>('shopper');

  // Sidebar Collapsible & Mobile Navigation State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('grocer_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('grocer_sidebar_collapsed', String(next));
      } catch {
        // ignore localStorage access issues
      }
      return next;
    });
  };

  // Core Data State
  const [rawProducts, setRawProducts] = useState<ToothpasteProduct[]>(DEFAULT_TOOTHPASTES);
  const [valueWeights, setValueWeights] = useState<ValueWeights>(DEFAULT_VALUE_WEIGHTS);

  // Dynamic Normalization & Mathematical Engine
  const { normalized: products, marketMedian100g } = useMemo(() => {
    return normalizeProducts(rawProducts, valueWeights);
  }, [rawProducts, valueWeights]);

  // Derived Economic & Market Metrics
  const kpis = useMemo(() => calculateMarketSummaryKPIs(products), [products]);
  const brandMetrics = useMemo(
    () => calculateBrandMetrics(products, kpis.medianPricePer100g),
    [products, kpis.medianPricePer100g]
  );
  const retailerMetrics = useMemo(
    () => calculateRetailerMetrics(products, kpis.medianPricePer100g),
    [products, kpis.medianPricePer100g]
  );
  const crossRetailerSKUs = useMemo(
    () => calculateCrossRetailerSKUs(products),
    [products]
  );
  const opportunities = useMemo(
    () => detectInvestigationOpportunities(products, crossRetailerSKUs, kpis.medianPricePer100g),
    [products, crossRetailerSKUs, kpis.medianPricePer100g]
  );

  // Modals & Inspection State
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [isValueModalOpen, setIsValueModalOpen] = useState<boolean>(false);

  // Side-by-Side Comparison Selection
  const [selectedForCompare, setSelectedForCompare] = useState<NormalizedProduct[]>([]);

  // Explorer initial query state
  const [explorerSearch, setExplorerSearch] = useState<string>('');

  // Top Value Products (sorted by composite value score)
  const topValueProducts = useMemo(() => {
    return [...products].sort((a, b) => b.value_score - a.value_score);
  }, [products]);

  // Handle Tab Navigation with Optional Search
  const handleNavigate = (tab: TabType, initialSearch?: string) => {
    if (initialSearch !== undefined) {
      setExplorerSearch(initialSearch);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compare handlers
  const handleToggleCompare = (product: NormalizedProduct) => {
    setSelectedForCompare((prev) => {
      const exists = prev.some((p) => p.product_id === product.product_id);
      if (exists) {
        return prev.filter((p) => p.product_id !== product.product_id);
      }
      if (prev.length >= 5) {
        alert('You can compare a maximum of 5 products simultaneously.');
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleRemoveFromCompare = (product: NormalizedProduct) => {
    setSelectedForCompare((prev) => prev.filter((p) => p.product_id !== product.product_id));
  };

  const handleAddToCompare = (product: NormalizedProduct) => {
    setSelectedForCompare((prev) => {
      if (prev.some((p) => p.product_id === product.product_id)) return prev;
      if (prev.length >= 5) return prev;
      return [...prev, product];
    });
  };

  const handleClearCompare = () => {
    setSelectedForCompare([]);
  };

  // Handle Persona Switch
  const handlePersonaChange = (newPersona: UserPersona) => {
    setPersona(newPersona);
    if (newPersona === 'shopper') {
      setCurrentTab('explorer');
    } else if (newPersona === 'analyst') {
      setCurrentTab('overview');
    } else if (newPersona === 'researcher') {
      setCurrentTab('economics');
    }
  };

  // Handle Dataset updates (from CSV import or reset)
  const handleUpdateProducts = (newNormalizedProducts: NormalizedProduct[]) => {
    // Preserve as raw records
    setRawProducts(newNormalizedProducts);
  };

  if (currentTab === 'landing') {
    return (
      <div className="min-h-screen bg-[#F7F9FC]">
        <LandingPage
          kpis={kpis}
          products={products}
          crossRetailer={crossRetailerSKUs}
          opportunities={opportunities}
          onEnterApp={(tab) => handleNavigate(tab || 'overview')}
        />
        {/* Product Detail Modal */}
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            allProducts={products}
            marketMedian100g={kpis.medianPricePer100g}
            onClose={() => setSelectedProduct(null)}
            onAddToCompare={(p) => handleAddToCompare(p)}
            isCompared={selectedForCompare.some((p) => p.product_id === selectedProduct.product_id)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] bg-atmospheric text-[#163829] flex font-sans selection:bg-[#EEF4EE] selection:text-[#176B4D]">
      {/* Collapsible Persistent Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        compareCount={selectedForCompare.length}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
      />

      {/* Main Workspace with dynamic margin matching sidebar width */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[margin-left] duration-200 ease-in-out ${
          isSidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[264px]'
        }`}
      >
        {/* Workspace Top Header with Breadcrumbs and Global Controls */}
        <Header
          currentTab={currentTab}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          persona={persona}
          onChangePersona={handlePersonaChange}
          onOpenScoreConfig={() => setIsValueModalOpen(true)}
          compareCount={selectedForCompare.length}
          onNavigateToCompare={() => handleNavigate('compare')}
          onNavigateToLanding={() => handleNavigate('landing')}
          isDemoData={rawProducts === DEFAULT_TOOTHPASTES}
        />

        {/* Main Application Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentTab === 'home' && (
            <HeroHome
              kpis={kpis}
              topValueProducts={topValueProducts}
              lowestUnitPrice={kpis.lowestUnitPrice?.product || null}
              opportunities={opportunities}
              onNavigate={handleNavigate}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'overview' && (
            <MarketOverviewTab
              products={products}
              kpis={kpis}
              brandMetrics={brandMetrics}
              crossRetailer={crossRetailerSKUs}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'competitive' && (
            <CompetitiveLandscapeTab
              products={products}
              crossRetailer={crossRetailerSKUs}
              marketMedian100g={kpis.medianPricePer100g}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onNavigateToOpportunities={() => handleNavigate('opportunities')}
            />
          )}

          {currentTab === 'explorer' && (
            <PriceExplorerTab
              products={products}
              marketMedian100g={kpis.medianPricePer100g}
              initialSearch={explorerSearch}
              onSelectProduct={(p) => setSelectedProduct(p)}
              selectedForCompare={selectedForCompare}
              onToggleCompare={handleToggleCompare}
            />
          )}

          {currentTab === 'compare' && (
            <ProductComparisonTab
              products={products}
              selectedProducts={selectedForCompare}
              onRemoveFromCompare={handleRemoveFromCompare}
              onAddToCompare={handleAddToCompare}
              onClearCompare={handleClearCompare}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'brands' && (
            <BrandAnalysisTab
              brandMetrics={brandMetrics}
              marketMedian100g={kpis.medianPricePer100g}
              products={products}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'brand_architecture' && (
            <BrandPriceArchitectureTab
              products={products}
              marketMedian100g={kpis.medianPricePer100g}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'retailers' && (
            <RetailerAnalysisTab
              retailerMetrics={retailerMetrics}
              crossRetailerSKUs={crossRetailerSKUs}
              marketMedian100g={kpis.medianPricePer100g}
              products={products}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'channel_architecture' && (
            <ChannelPriceArchitectureTab
              products={products}
              marketMedian100g={kpis.medianPricePer100g}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'opportunities' && (
            <OpportunitiesTab
              products={products}
              crossRetailer={crossRetailerSKUs}
              marketMedian100g={kpis.medianPricePer100g}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onNavigateToCompetitive={() => handleNavigate('competitive')}
            />
          )}

          {currentTab === 'positioning' && (
            <ProductPositioningTab
              products={products}
              marketMedian100g={kpis.medianPricePer100g}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'trends' && (
            <PriceTrendsTab
              products={products}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'economics' && (
            <EconomicAnalysisTab
              products={products}
              marketMedian100g={kpis.medianPricePer100g}
            />
          )}

          {currentTab === 'methodology' && (
            <DataMethodologyTab
              products={products}
              onUpdateProducts={handleUpdateProducts}
              onOpenValueModel={() => setIsValueModalOpen(true)}
            />
          )}
        </main>

        {/* Institutional Footer */}
        <footer className="bg-white border-t border-[#E3E6DF] mt-12 py-8 text-xs text-[#737A74]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#163829] tracking-[0.08em] text-sm font-sans">
                THE GROCER
              </span>
              <span className="text-[#E3E6DF]">|</span>
              <span className="text-[#4F5751]">Philippine Retail Market Intelligence</span>
              <span className="hidden md:inline text-[#E3E6DF]">|</span>
              <span className="hidden md:inline text-[#737A74] italic">
                &ldquo;Reading the Market, One Shelf at a Time.&rdquo;
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#737A74]">
              <span>
                Base 100 ={' '}
                <strong className="font-data font-semibold text-[#163829]">
                  ₱{kpis.medianPricePer100g.toFixed(2)}/100g
                </strong>{' '}
                Market Median
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleNavigate('methodology')}
                className="hover:text-[#176B4D] transition-colors cursor-pointer"
              >
                Methodology & Audit
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          allProducts={products}
          marketMedian100g={kpis.medianPricePer100g}
          onClose={() => setSelectedProduct(null)}
          onAddToCompare={(p) => handleAddToCompare(p)}
          isCompared={selectedForCompare.some((p) => p.product_id === selectedProduct.product_id)}
        />
      )}

      {/* Value Model Configuration Modal */}
      {isValueModalOpen && (
        <ValueScoreModal
          weights={valueWeights}
          onSaveWeights={(newWeights) => setValueWeights(newWeights)}
          onClose={() => setIsValueModalOpen(false)}
        />
      )}
    </div>
  );
}
