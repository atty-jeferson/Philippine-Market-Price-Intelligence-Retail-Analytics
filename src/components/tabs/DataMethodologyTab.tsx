import React, { useRef, useState, useMemo } from 'react';
import {
  FileText,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Check,
  FileSpreadsheet,
  Layers,
  Database,
  Calendar,
  Tag,
  Hash,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  BarChart2,
  Calculator,
  Scale,
  TrendingUp,
  Activity
} from 'lucide-react';
import { NormalizedProduct, DataQualityReport } from '../../types';
import { PageHeader, EvidenceBadge, KPICard } from '../common/DesignSystem';
import {
  exportProductsToCSV,
  downloadCSV,
  processImportedCSV,
  generateDataQualityReport
} from '../../utils/csvHandler';
import { DEFAULT_TOOTHPASTES } from '../../data/sampleToothpastes';
import { normalizeProducts } from '../../utils/calculations';
import {
  auditInMemoryProducts,
  ValidationSummary,
  ValidationIssue,
  IngestionPipelineResult,
  CANONICAL_FIELD_REGISTRY
} from '../../domain';

interface DataMethodologyTabProps {
  products: NormalizedProduct[];
  onUpdateProducts: (newProducts: NormalizedProduct[]) => void;
  onOpenValueModel: () => void;
}

type InspectorSubTab = 'audit_ledger' | 'schema_mapping' | 'identity_evidence' | 'statistical_standards';
type SeverityFilter = 'ALL' | 'ERROR' | 'WARNING' | 'INFO' | 'DUPLICATE';

export const DataMethodologyTab: React.FC<DataMethodologyTabProps> = ({
  products,
  onUpdateProducts,
  onOpenValueModel
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSubTab, setActiveSubTab] = useState<InspectorSubTab>('audit_ledger');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [lastPipelineResult, setLastPipelineResult] = useState<IngestionPipelineResult | null>(null);

  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Compute live validation audit for in-memory products
  const liveAuditSummary: ValidationSummary = useMemo(() => {
    if (lastPipelineResult) {
      return lastPipelineResult.validationSummary;
    }
    return auditInMemoryProducts(products);
  }, [products, lastPipelineResult]);

  const qualityReport: DataQualityReport = useMemo(() => {
    return generateDataQualityReport(products);
  }, [products]);

  const handleExportAll = () => {
    const csv = exportProductsToCSV(products);
    downloadCSV('the_grocer_ph_toothpaste_dataset.csv', csv);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = processImportedCSV(text);

        if (result.products.length === 0) {
          setImportStatus({
            type: 'error',
            message: 'CSV parsed 0 valid product observations. Please ensure required identity and price columns are present.'
          });
          if (result.pipelineResult) {
            setLastPipelineResult(result.pipelineResult);
          }
          return;
        }

        const { normalized } = normalizeProducts(result.products);
        onUpdateProducts(normalized);

        if (result.pipelineResult) {
          setLastPipelineResult(result.pipelineResult);
        }

        const summary = result.pipelineResult?.validationSummary;
        const warnCount = summary ? summary.warningCount : 0;
        const dupCount = summary ? summary.duplicateCount : 0;

        setImportStatus({
          type: 'success',
          message: `Ingested ${normalized.length} valid observations (${result.report.excludedRows} rejected, ${warnCount} warnings, ${dupCount} duplicates flagged).`
        });
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: `Failed to import CSV: ${err.message || 'Syntax error'}`
        });
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    const { normalized: defaultNormalized } = normalizeProducts(DEFAULT_TOOTHPASTES);
    onUpdateProducts(defaultNormalized);
    setLastPipelineResult(null);
    setImportStatus({
      type: 'success',
      message: `Reset dataset to default ${defaultNormalized.length} benchmark Philippine market observations.`
    });
  };

  // Filter issues for ledger
  const filteredIssues = useMemo(() => {
    if (severityFilter === 'ALL') return liveAuditSummary.issues;
    if (severityFilter === 'DUPLICATE') {
      return liveAuditSummary.issues.filter((i) => i.code === 'DUPLICATE_OBSERVATION');
    }
    return liveAuditSummary.issues.filter((i) => i.severity === severityFilter);
  }, [liveAuditSummary, severityFilter]);

  return (
    <div className="space-y-8 pb-14">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Data Trust & Methodology Audit"
        subtitle="Validation ledger, schema mapping registry, identity evidence provenance, and statistical econometric standards."
        actions={
          <div className="flex items-center gap-2">
            <button
              id="open-value-model-btn"
              type="button"
              onClick={onOpenValueModel}
              className="text-xs font-semibold bg-white text-[#163829] hover:bg-[#FAFAF7] px-3 py-1.5 rounded-lg border border-[#E3E6DF] transition-all shadow-xs cursor-pointer font-sans"
            >
              Configure Value Score Model
            </button>
            <EvidenceBadge status="Verified" size="md" />
          </div>
        }
      />

      {/* 2. IMPORT / EXPORT & DATASET MANAGEMENT CONTROLS */}
      <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF0EA] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#163829] flex items-center gap-2 tracking-tight font-sans">
              <Database className="w-5 h-5 text-[#176B4D]" />
              <span>Dataset Import &amp; Ingestion Center</span>
            </h3>
            <p className="text-xs text-[#737A74] mt-0.5 font-sans">
              Multi-tier CSV ingestion with automated column mapping, entity resolution, and audit validation
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap font-sans">
            <button
              id="export-complete-csv-btn"
              type="button"
              onClick={handleExportAll}
              className="flex items-center gap-1.5 text-xs bg-[#176B4D] hover:bg-[#12523B] text-white font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full CSV ({products.length})</span>
            </button>

            <button
              id="import-csv-trigger-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs bg-[#FAFAF7] hover:bg-[#EEF0EA] text-[#163829] font-semibold px-3.5 py-2 rounded-lg border border-[#E3E6DF] transition-all cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#176B4D]" />
              <span>Import CSV</span>
            </button>

            <button
              id="reset-default-data-btn"
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 text-xs text-[#737A74] hover:text-[#163829] bg-[#FAFAF7] hover:bg-[#EEF0EA] px-3 py-2 rounded-lg border border-[#E3E6DF] transition-all cursor-pointer shadow-xs"
              title="Restore standard benchmark Philippine market observations"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
          </div>
        </div>

        {/* Status Notification */}
        {importStatus.type && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-sans ${
              importStatus.type === 'success'
                ? 'bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1]'
                : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FEE2E2]'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#176B4D] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#991B1B] shrink-0" />
            )}
            <span className="font-medium">{importStatus.message}</span>
          </div>
        )}

        <div className="text-[11px] text-[#737A74] leading-relaxed font-sans">
          <span className="font-bold text-[#163829]">Ingestion Engine:</span> Automatically maps column aliases for Brand, Product Name, Variant, GTIN Barcode, Shelf Price, SRP, Retailer, Store Branch, Date, Net Content, UOM, and Multipack Units.
        </div>
      </div>

      {/* 3. TRUST SCOREBOARD */}
      <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF0EA] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#163829] flex items-center gap-2 tracking-tight">
              <ShieldCheck className="w-5 h-5 text-[#176B4D]" />
              <span>Ingestion Trust Scoreboard &amp; Coverage</span>
            </h3>
            <p className="text-xs text-[#737A74] mt-0.5">
              Continuous validation measuring data completeness, physical identity resolution, and temporal freshness
            </p>
          </div>
          <div className="text-xs font-bold px-3 py-1 rounded-md bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1]">
            Trust Score: <span className="font-data">{liveAuditSummary.qualityScorePercent}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
            <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Active SKUs</span>
            <div className="text-xl font-data tabular-nums font-bold text-[#163829] mt-0.5">{liveAuditSummary.validRows}</div>
            <span className="text-[#737A74] text-[10px]">In-memory dataset</span>
          </div>

          <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
            <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Rejected Rows</span>
            <div className={`text-xl font-data tabular-nums font-bold mt-0.5 ${liveAuditSummary.rejectedRows > 0 ? 'text-[#991B1B]' : 'text-[#176B4D]'}`}>
              {liveAuditSummary.rejectedRows}
            </div>
            <span className="text-[#737A74] text-[10px]">Missing identity/price</span>
          </div>

          <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
            <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Warnings Flagged</span>
            <div className={`text-xl font-data tabular-nums font-bold mt-0.5 ${liveAuditSummary.warningCount > 0 ? 'text-[#B8860B]' : 'text-[#176B4D]'}`}>
              {liveAuditSummary.warningCount}
            </div>
            <span className="text-[#737A74] text-[10px]">Remediated / usable</span>
          </div>

          <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
            <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Duplicates</span>
            <div className={`text-xl font-data tabular-nums font-bold mt-0.5 ${liveAuditSummary.duplicateCount > 0 ? 'text-[#B8860B]' : 'text-[#176B4D]'}`}>
              {liveAuditSummary.duplicateCount}
            </div>
            <span className="text-[#737A74] text-[10px]">Same SKU+Store+Date</span>
          </div>

          <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
            <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Price Outliers</span>
            <div className="text-xl font-data tabular-nums font-bold text-[#163829] mt-0.5">
              {qualityReport.suspiciousPriceCount}
            </div>
            <span className="text-[#737A74] text-[10px]">&gt; 3 std deviations</span>
          </div>

          <div className="p-3 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl">
            <span className="text-[#737A74] text-[10px] uppercase tracking-wider font-bold">Freshness</span>
            <div className="text-sm font-data font-bold text-[#163829] mt-1 truncate" title={liveAuditSummary.freshness.newestDate || 'N/A'}>
              {liveAuditSummary.freshness.newestDate || 'Aug 2024'}
            </div>
            <span className="text-[#737A74] text-[10px]">
              {liveAuditSummary.freshness.dateSpanDays > 0 ? `${liveAuditSummary.freshness.dateSpanDays}d window` : 'Single snapshot'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE INGESTION INSPECTOR */}
      <div className="bg-white rounded-xl border border-[#E3E6DF] shadow-card overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E3E6DF] bg-[#FAFAF7] px-4 pt-2 gap-2 text-xs overflow-x-auto font-sans">
          <button
            id="subtab-audit-ledger-btn"
            type="button"
            onClick={() => setActiveSubTab('audit_ledger')}
            className={`px-3 py-2.5 border-b-2 font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'audit_ledger'
                ? 'border-[#176B4D] text-[#176B4D] bg-white rounded-t-lg'
                : 'border-transparent text-[#737A74] hover:text-[#163829]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Validation &amp; Issue Ledger ({liveAuditSummary.issues.length})</span>
          </button>

          <button
            id="subtab-schema-mapping-btn"
            type="button"
            onClick={() => setActiveSubTab('schema_mapping')}
            className={`px-3 py-2.5 border-b-2 font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'schema_mapping'
                ? 'border-[#176B4D] text-[#176B4D] bg-white rounded-t-lg'
                : 'border-transparent text-[#737A74] hover:text-[#163829]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schema &amp; Field Registry</span>
          </button>

          <button
            id="subtab-identity-evidence-btn"
            type="button"
            onClick={() => setActiveSubTab('identity_evidence')}
            className={`px-3 py-2.5 border-b-2 font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'identity_evidence'
                ? 'border-[#176B4D] text-[#176B4D] bg-white rounded-t-lg'
                : 'border-transparent text-[#737A74] hover:text-[#163829]'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Identity &amp; Provenance</span>
          </button>

          <button
            id="subtab-statistical-standards-btn"
            type="button"
            onClick={() => setActiveSubTab('statistical_standards')}
            className={`px-3 py-2.5 border-b-2 font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'statistical_standards'
                ? 'border-[#176B4D] text-[#176B4D] bg-white rounded-t-lg'
                : 'border-transparent text-[#737A74] hover:text-[#163829]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Statistical &amp; Econometric Standards</span>
          </button>
        </div>

        {/* Sub-Tab 1: Validation & Issue Ledger */}
        {activeSubTab === 'audit_ledger' && (
          <div className="p-6 space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEF0EA]">
              <div>
                <h4 className="text-sm font-bold text-[#163829]">Structured Issue Audit Ledger</h4>
                <p className="text-xs text-[#737A74]">
                  Explicit severity categorization separating fatal rejection errors from non-fatal quality warnings
                </p>
              </div>

              {/* Severity Filter Chips */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => setSeverityFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    severityFilter === 'ALL'
                      ? 'bg-[#163829] text-white shadow-xs'
                      : 'bg-[#FAFAF7] text-[#737A74] hover:bg-[#EEF0EA] border border-[#E3E6DF]'
                  }`}
                >
                  All ({liveAuditSummary.issues.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSeverityFilter('ERROR')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    severityFilter === 'ERROR'
                      ? 'bg-[#991B1B] text-white'
                      : 'bg-[#FAFAF7] text-[#991B1B] hover:bg-red-50 border border-[#E3E6DF]'
                  }`}
                >
                  Errors ({liveAuditSummary.errorCount})
                </button>

                <button
                  type="button"
                  onClick={() => setSeverityFilter('WARNING')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    severityFilter === 'WARNING'
                      ? 'bg-[#B8860B] text-white'
                      : 'bg-[#FAFAF7] text-[#B8860B] hover:bg-amber-50 border border-[#E3E6DF]'
                  }`}
                >
                  Warnings ({liveAuditSummary.warningCount})
                </button>

                <button
                  type="button"
                  onClick={() => setSeverityFilter('DUPLICATE')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    severityFilter === 'DUPLICATE'
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-[#FAFAF7] text-[#7C3AED] hover:bg-purple-50 border border-[#E3E6DF]'
                  }`}
                >
                  Duplicates ({liveAuditSummary.duplicateCount})
                </button>

                <button
                  type="button"
                  onClick={() => setSeverityFilter('INFO')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    severityFilter === 'INFO'
                      ? 'bg-[#176B4D] text-white'
                      : 'bg-[#FAFAF7] text-[#176B4D] hover:bg-[#EEF4EE] border border-[#E3E6DF]'
                  }`}
                >
                  Info ({liveAuditSummary.infoCount})
                </button>
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="py-12 text-center text-[#737A74] text-xs">
                <CheckCircle2 className="w-8 h-8 text-[#176B4D] mx-auto mb-2 opacity-80" />
                <span>No issues found matching severity filter <strong className="text-[#163829]">{severityFilter}</strong>.</span>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E3E6DF] rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#FAFAF7] text-[#737A74] uppercase tracking-wider font-semibold border-b border-[#E3E6DF] text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Field</th>
                      <th className="py-2.5 px-3">Rule Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Remediation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF0EA] font-sans">
                    {filteredIssues.slice(0, 50).map((issue, idx) => (
                      <tr key={idx} className="hover:bg-[#FAFAF7]">
                        <td className="py-2 px-3 font-data text-[#163829]">#{issue.rowNumber}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              issue.severity === 'ERROR'
                                ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FEE2E2]'
                                : issue.severity === 'WARNING'
                                ? 'bg-[#FFFDF5] text-[#B8860B] border border-[#FEEBB5]'
                                : 'bg-[#EEF4EE] text-[#176B4D] border border-[#DDEBE1]'
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-data text-[#163829]">{issue.field || 'all'}</td>
                        <td className="py-2 px-3 font-data text-[11px] text-[#737A74]">{issue.code}</td>
                        <td className="py-2 px-3 text-[#163829] max-w-xs truncate" title={issue.message}>
                          {issue.message}
                        </td>
                        <td className="py-2 px-3 text-[#737A74] text-[11px] italic">
                          {issue.remediationAction || 'Logged in audit report'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sub-Tab 2: Schema & Field Mapping Registry */}
        {activeSubTab === 'schema_mapping' && (
          <div className="p-6 space-y-5 font-sans">
            <div>
              <h4 className="text-sm font-bold text-[#163829]">Curated Schema Mapping Registry</h4>
              <p className="text-xs text-[#737A74]">
                The mapping layer recognizes structured retail CSV headers and harmonizes synonym variations without sprawl
              </p>
            </div>

            {/* Last imported column inspection if available */}
            {lastPipelineResult && lastPipelineResult.schemaReport.mappings.length > 0 && (
              <div className="p-4 bg-[#EEF4EE] border border-[#DDEBE1] rounded-xl space-y-2 text-xs">
                <h5 className="font-bold text-[#176B4D] flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[#176B4D]" />
                  <span>Last Imported CSV Header Analysis ({lastPipelineResult.schemaReport.mappings.length} columns detected)</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                  {lastPipelineResult.schemaReport.mappings.map((m, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-[#DDEBE1] text-[11px]">
                      <div className="font-data text-[#163829] font-bold truncate" title={m.rawHeader}>
                        &ldquo;{m.rawHeader}&rdquo;
                      </div>
                      <div className="text-[#176B4D] mt-0.5 flex items-center gap-1 font-data">
                        <span>&rarr;</span>
                        <span>{m.matchedField ? m.matchedField.canonicalKey : 'Unmapped'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-[#E3E6DF] rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#FAFAF7] text-[#737A74] uppercase tracking-wider font-semibold border-b border-[#E3E6DF] text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Canonical Key</th>
                    <th className="py-2.5 px-3">Canonical Label</th>
                    <th className="py-2.5 px-3">Required</th>
                    <th className="py-2.5 px-3">Recognized Aliases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF0EA] font-sans">
                  {CANONICAL_FIELD_REGISTRY.map((field, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAF7]">
                      <td className="py-2 px-3 font-data font-bold text-[#176B4D]">{field.canonicalKey}</td>
                      <td className="py-2 px-3 text-[#163829] font-medium">{field.label}</td>
                      <td className="py-2 px-3">
                        {field.required ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FEE2E2]">
                            Required
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#FAFAF7] text-[#737A74] border border-[#E3E6DF]">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#737A74]">
                        <div className="flex flex-wrap gap-1">
                          {field.aliases.slice(0, 6).map((alias, aIdx) => (
                            <code key={aIdx} className="bg-[#FAFAF7] px-1 py-0.5 rounded text-[10px] font-data border border-[#E3E6DF] text-[#163829]">
                              {alias}
                            </code>
                          ))}
                          {field.aliases.length > 6 && (
                            <span className="text-[10px] text-[#737A74] font-data self-center">+{field.aliases.length - 6} more</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 3: Identity Resolution & Evidence Provenance */}
        {activeSubTab === 'identity_evidence' && (
          <div className="p-6 space-y-5 font-sans">
            <div>
              <h4 className="text-sm font-bold text-[#163829]">Identity Resolution &amp; Evidence Classification Hierarchy</h4>
              <p className="text-xs text-[#737A74]">
                How THE GROCER distinguishes physical consumer SKUs from multiple store shelf listings and tracks observational provenance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-2">
                <div className="font-bold text-[#176B4D] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Hash className="w-4 h-4 text-[#176B4D]" />
                  <span>Tier 1: Global GTIN / EAN</span>
                </div>
                <p className="text-[#737A74] text-[11px] leading-relaxed">
                  Authoritative 13-digit EAN/GTIN barcodes directly identifying the global trade unit. Highest confidence, zero ambiguity across channels.
                </p>
                <div className="text-[10px] text-[#176B4D] font-data font-bold bg-[#EEF4EE] px-2 py-1 rounded-md border border-[#DDEBE1]">
                  Format: sku-gtin-4800012345678
                </div>
              </div>

              <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-2">
                <div className="font-bold text-[#163829] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Tag className="w-4 h-4 text-[#163829]" />
                  <span>Tier 2: Explicit Catalog ID</span>
                </div>
                <p className="text-[#737A74] text-[11px] leading-relaxed">
                  Explicit manufacturer or authoritative syndicated catalog identifiers provided by ERP feeds or structured shelf audits.
                </p>
                <div className="text-[10px] text-[#163829] font-data font-bold bg-white px-2 py-1 rounded-md border border-[#E3E6DF]">
                  Format: sku-id-col-tot-150
                </div>
              </div>

              <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-2">
                <div className="font-bold text-[#B8860B] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-[#B8860B]" />
                  <span>Tier 3: Composite Slug Fallback</span>
                </div>
                <p className="text-[#737A74] text-[11px] leading-relaxed">
                  Deterministic normalized slug constructed from: Brand + Formulation + Variant + Net Content + UOM + Multipack Count.
                </p>
                <div className="text-[10px] text-[#B8860B] font-data font-bold bg-[#FFFDF5] px-2 py-1 rounded-md border border-[#FEEBB5]">
                  Format: sku-colgate-total-12-clean-mint-150g
                </div>
              </div>
            </div>

            {/* Evidence Classifications */}
            <div className="p-4 bg-white border border-[#E3E6DF] rounded-xl space-y-3">
              <h5 className="font-bold text-[#163829] text-xs uppercase tracking-wider">Four-Tier Evidence Provenance Classification</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF]">
                  <span className="text-[10px] uppercase font-bold text-[#176B4D]">Observed</span>
                  <div className="font-bold text-[#163829] mt-1">Direct Shelf Price</div>
                  <p className="text-[11px] text-[#737A74] mt-0.5">Scraped or audited consumer retail price at checkout</p>
                </div>

                <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF]">
                  <span className="text-[10px] uppercase font-bold text-[#163829]">Derived</span>
                  <div className="font-bold text-[#163829] mt-1">₱ / 100g &amp; Index</div>
                  <p className="text-[11px] text-[#737A74] mt-0.5">Calculated using mathematical unit economics formulas</p>
                </div>

                <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF]">
                  <span className="text-[10px] uppercase font-bold text-[#B8860B]">Inferred</span>
                  <div className="font-bold text-[#163829] mt-1">Synchronized SRP</div>
                  <p className="text-[11px] text-[#737A74] mt-0.5">Backfilled base regular price when discount is absent</p>
                </div>

                <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E3E6DF]">
                  <span className="text-[10px] uppercase font-bold text-[#7C3AED]">Estimated</span>
                  <div className="font-bold text-[#163829] mt-1">Density / Imputation</div>
                  <p className="text-[11px] text-[#737A74] mt-0.5">Assumed metric conversions (e.g. 1ml ~ 1.3g paste)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab 4: Statistical Inference & Econometric Standards */}
        {activeSubTab === 'statistical_standards' && (
          <div className="p-6 space-y-6 font-sans">
            <div>
              <h4 className="text-sm font-bold text-[#163829]">Statistical Inference, Regression &amp; Benchmarking Standards</h4>
              <p className="text-xs text-[#737A74]">
                Methodological rigor ensuring all estimations, confidence intervals, regressions, and longitudinal comparisons are mathematically sound, reproducible, and defensible
              </p>
            </div>

            {/* Grid of Statistical Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Card 1: Small Sample Inference & Student's t */}
              <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-2">
                <div className="font-bold text-[#176B4D] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Calculator className="w-4 h-4 text-[#176B4D]" />
                  <span>1. Student's t-Distribution vs Asymptotic Normal</span>
                </div>
                <p className="text-[#737A74] text-[11px] leading-relaxed">
                  In FMCG retail market intelligence, brand portfolios often contain modest sample sizes (<strong className="text-[#163829]">n &lt; 30</strong>).
                  Relying on asymptotic normal approximations (e.g., fixed <code className="bg-white px-1 py-0.5 rounded border border-[#E3E6DF] font-data">z = 1.96</code>)
                  severely understates sampling variability and produces artificially tight confidence intervals.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-[#E3E6DF] space-y-1 font-data text-[11px] text-[#176B4D]">
                  <div>df = n - 1</div>
                  <div>CI_95 = [ x̄ - t_(0.025, df) × SE, x̄ + t_(0.025, df) × SE ]</div>
                  <div className="text-[10px] text-[#737A74]">SE = s / √n (unbiased sample standard deviation)</div>
                </div>
                <p className="text-[#737A74] text-[10px]">
                  When sample size is insufficient (<strong className="text-[#163829]">n &lt; 2</strong>), the system explicitly refuses to calculate interval bounds and marks the result with an insufficient data badge.
                </p>
              </div>

              {/* Card 2: Gauss-Jordan OLS & Singularity Safeguards */}
              <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-2">
                <div className="font-bold text-[#176B4D] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-[#176B4D]" />
                  <span>2. Multivariate OLS Matrix Inversion</span>
                </div>
                <p className="text-[#737A74] text-[11px] leading-relaxed">
                  Both Package Size Economics (<code className="bg-white px-1 py-0.5 rounded border border-[#E3E6DF] font-data">ln(P) ~ ln(Q)</code>)
                  and Hedonic Pricing models solve the normal equation:
                  <br />
                  <span className="font-data text-[#176B4D] font-bold inline-block my-1">(X^T X) β = X^T Y</span>
                </p>
                <p className="text-[#737A74] text-[11px] leading-relaxed">
                  Our numerical solver employs <strong className="text-[#163829]">Gauss-Jordan elimination with partial row pivoting</strong>.
                  Before inversion, the engine screens for:
                </p>
                <ul className="list-disc list-inside text-[11px] text-[#737A74] space-y-0.5">
                  <li>Sample adequacy: <span className="font-data">n &gt; k + 1</span> (strictly more observations than regressors)</li>
                  <li>Zero-variance regressor elimination (e.g. constant dummy indicators)</li>
                  <li>Near-singular matrix protection via pivoting tolerance (<span className="font-data">|pivot| &lt; 10^-12</span>)</li>
                </ul>
              </div>

              {/* Card 3: Objective Pricing Metrics & Benchmarks */}
              <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-2">
                <div className="font-bold text-[#176B4D] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-[#176B4D]" />
                  <span>3. Price Indexes &amp; Benchmark Definitions</span>
                </div>
                <p className="text-[#737A74] text-[11px] leading-relaxed">
                  To eliminate subjective pricing claims, THE GROCER grounds all relative metrics against explicit, mathematically defined benchmarks:
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-[#E3E6DF]">
                    <span className="font-data font-bold text-[#176B4D]">Price Competitiveness Index (PCI):</span>
                    <div className="font-data text-[10px] text-[#737A74] mt-0.5">PCI = (P_product / P_benchmark) × 100</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#E3E6DF]">
                    <span className="font-data font-bold text-[#176B4D]">Relative Price Position (RPP):</span>
                    <div className="font-data text-[10px] text-[#737A74] mt-0.5">RPP = ((P_product - P_benchmark) / P_benchmark) × 100</div>
                  </div>
                </div>
                <p className="text-[#737A74] text-[10px]">
                  Benchmarks supported: Overall Market Median, Brand Portfolio Median, Subsegment Median, and Positioning Tier Median.
                </p>
              </div>

              {/* Card 4: Longitudinal Price Change & Log Volatility */}
              <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-2">
                <div className="font-bold text-[#176B4D] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-[#176B4D]" />
                  <span>4. Longitudinal Dynamics &amp; Log Volatility</span>
                </div>
                <p className="text-[#737A74] text-[11px] leading-relaxed">
                  Longitudinal price dynamics are computed strictly from sequential, time-stamped retail observation snapshots:
                </p>
                <div className="space-y-1 text-[11px] font-data text-[#176B4D]">
                  <div className="p-2 bg-white rounded-lg border border-[#E3E6DF]">
                    <div className="font-bold">Log-Return Volatility (σ_log):</div>
                    <div className="text-[10px] text-[#737A74] mt-0.5 font-sans">
                      Standard deviation of log returns r_t = ln(P_t / P_{'{t-1}'}), providing scale-invariant volatility measurement across price levels.
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#E3E6DF]">
                    <div className="font-bold">12-Month YoY Change:</div>
                    <div className="text-[10px] text-[#737A74] mt-0.5 font-sans">
                      Requires paired observations separated by at least 300 days (refuses fabrication if no prior-year record exists).
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Limitations & Disclaimers */}
            <div className="p-4 bg-[#FFFDF5] border border-[#FEEBB5] rounded-xl text-xs text-[#163829] space-y-2">
              <div className="font-bold text-[#B8860B] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#B8860B]" />
                <span>Enterprise Econometric Limitations &amp; Causal Attribution Disclaimer</span>
              </div>
              <p className="text-[#737A74] leading-relaxed text-[11px]">
                THE GROCER records point-in-time shelf listings across Philippine physical and digital supermarket channels.
                While these observations provide empirical transparency on consumer-facing price structures, they do not directly observe commercial wholesale acquisition costs, confidential trade promotion allowances, or store-level sales velocities.
                Consequently, users must avoid drawing causal conclusions regarding corporate profit margins or national inflation drivers without controlling for external commodity price shocks, packaging material shifts, and currency exchange fluctuations.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 5. METHODOLOGICAL STANDARDS & FORMULATIONS */}
      <div className="bg-white p-6 rounded-xl border border-[#E3E6DF] shadow-card space-y-5 font-sans">
        <h3 className="text-xl font-bold text-[#163829] border-b border-[#EEF0EA] pb-4 tracking-tight">
          Methodological Standards &amp; Mathematical Formulations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-[#737A74]">
          <div className="space-y-4">
            <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-1.5">
              <h4 className="font-bold text-[#163829] text-sm">1. Unit Normalization Standard</h4>
              <p className="text-[#737A74]">
                Toothpaste products in the Philippines are sold in net grams (g) or milliliters (ml), ranging from 40g travel tubes to 300g twin bundles.
                All products are standardized to <strong className="text-[#163829] font-bold">₱ per 100 grams</strong> (or 100ml, under standard density assumptions).
                <br />
                <code className="bg-white text-[#176B4D] px-1.5 py-0.5 rounded-md font-data text-[11px] border border-[#E3E6DF] inline-block mt-1 font-bold">
                  Unit Price = (Shelf Price / Total Net Quantity) × Standard Basis
                </code>
              </p>
            </div>

            <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-1.5">
              <h4 className="font-bold text-[#163829] text-sm">2. Multipack &amp; Twin Pack Accounting</h4>
              <p className="text-[#737A74]">
                When a product is sold as a bundle (e.g., 2 x 150g tubes), the total sellable quantity is calculated as:
                <br />
                <code className="bg-white text-[#176B4D] px-1.5 py-0.5 rounded-md font-data text-[11px] border border-[#E3E6DF] inline-block my-1 font-bold">
                  Q_total = Multipack Units (N) × Net Content (Q)
                </code>
                <br />
                Unit pricing always reflects total package content delivered to the consumer, avoiding distortion of bundle discounts.
              </p>
            </div>

            <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-1.5">
              <h4 className="font-bold text-[#163829] text-sm">3. Promotion &amp; Shelf Price Treatment</h4>
              <p className="text-[#737A74]">
                Both regular (SRP) and promotional shelf prices are recorded independently. Active unit pricing uses the currently observed shelf price.
                The regular price is preserved to track promotional depth:
                <br />
                <code className="bg-white text-[#176B4D] px-1.5 py-0.5 rounded-md font-data text-[11px] border border-[#E3E6DF] inline-block mt-1 font-bold">
                  Discount % = ((Regular Price - Shelf Price) / Regular Price) × 100
                </code>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-1.5">
              <h4 className="font-bold text-[#163829] text-sm">4. Price Index Baseline (Base = 100)</h4>
              <p className="text-[#737A74]">
                The <strong className="text-[#163829] font-bold">Price Index</strong> uses the current market median unit price as base 100:
                <br />
                <code className="bg-white text-[#176B4D] px-1.5 py-0.5 rounded-md font-data text-[11px] border border-[#E3E6DF] inline-block mt-1 font-bold">
                  Price Index = (Product Price per 100g / Market Median Price per 100g) × 100
                </code>
                <br />
                An index of 85 indicates the item is 15% cheaper than the median, while 135 indicates a 35% premium.
              </p>
            </div>

            <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-1.5">
              <h4 className="font-bold text-[#163829] text-sm">5. Multi-Criteria Value Score</h4>
              <p className="text-[#737A74]">
                A composite 0–100 score balancing unit price advantage (40%), customer satisfaction ratings (25%), active promotions (15%), and dental clinical actives such as fluoride, sensitivity relief, and whitening (20%).
              </p>
            </div>

            <div className="p-4 bg-[#FAFAF7] border border-[#E3E6DF] rounded-xl space-y-1.5">
              <h4 className="font-bold text-[#163829] text-sm">6. Brand Presence vs True Concentration</h4>
              <p className="text-[#737A74]">
                Because commercial sales volumes are not publicly observable from store shelf audits, we strictly report the descriptive <strong className="text-[#163829] font-bold">Brand Presence Index</strong> (proportion of catalog SKUs).
                We explicitly avoid misleading HHI concentration claims.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
