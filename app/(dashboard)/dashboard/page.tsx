'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Route } from 'next';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import type { ApiError } from '@/lib/api/http';
import { startComprehensiveScan } from '@/lib/api/scans';
import type { ComprehensiveScanResponse } from '@/lib/api/scans';
import { readLastImport, type LastImportRecord } from '@/lib/storage/imports';

type ScanMode = 'ai' | 'comprehensive';
type Severity = 'Critical' | 'High' | 'Medium';
type PhaseStatus = 'pending' | 'active' | 'completed';

type Vulnerability = {
  title: string;
  location: string;
  severity: Severity;
  analysis: string;
  confidence: number;
  cta: string;
  snippetLabel?: string;
  snippet?: Array<{ content: string; highlighted?: boolean }>;
  fixSnippetLabel?: string;
  fixSnippet?: string[];
};

const scanModes: ReadonlyArray<{
  id: ScanMode;
  label: string;
  icon: string;
  description: string;
}> = [
  { id: 'ai', label: 'AI-Powered SAST', icon: '🧠', description: 'Fast & Intelligent' },
  { id: 'comprehensive', label: 'Comprehensive Engine', icon: '⚡', description: 'Deep Analysis' }
];

const navItems: ReadonlyArray<{
  label: string;
  href: Route;
  icon: string;
}> = [
  { label: 'Overview', href: '/dashboard' as Route, icon: '📊' },
  { label: 'Findings', href: '/dashboard/findings' as Route, icon: '🧾' },
  { label: 'Policies', href: '/dashboard/policies' as Route, icon: '📘' },
  { label: 'Integrations', href: '/dashboard/integrations' as Route, icon: '🔗' }
];

const defaultAiMetrics = [
  {
    label: 'Files Scanned',
    value: '247',
    helper: '↑ 23% faster than last scan',
    helperClassName: 'text-emerald-600'
  },
  {
    label: 'Vulnerabilities',
    value: '18',
    helper: '3 Critical',
    valueClassName: 'text-rose-600',
    helperClassName: 'text-rose-500'
  },
  {
    label: 'AI Confidence',
    value: '98.5%',
    helper: 'ML Model v3.2',
    helperClassName: 'text-sky-600'
  },
  {
    label: 'Auto-Fixable',
    value: '94%',
    helper: '17 of 18 issues',
    helperClassName: 'text-emerald-600'
  }
];

const defaultVulnerabilities: Vulnerability[] = [
  {
    title: 'SQL Injection in Payment Module',
    location: 'src/payment/database.js - Line 45-52',
    severity: 'Critical',
    snippetLabel: '// Vulnerable code detected:',
    snippet: [
      { content: "const query = `SELECT * FROM payments WHERE" },
      { content: "  user_id = '${userId}' AND amount = ${amount}`;", highlighted: true },
      { content: 'db.execute(query);' }
    ],
    analysis:
      'Direct string interpolation in SQL query creates injection vulnerability. This pattern matches OWASP A03:2021 and violates PCI-DSS compliance for payment processing.',
    fixSnippetLabel: '// AI Recommended Fix:',
    fixSnippet: [
      "const query = 'SELECT * FROM payments WHERE user_id = ? AND amount = ?';",
      'db.execute(query, [userId, amount]);'
    ],
    confidence: 99,
    cta: 'Apply AI Fix'
  },
  {
    title: 'Sensitive Data Exposure in Logs',
    location: 'src/api/auth.js - Line 128',
    severity: 'High',
    snippetLabel: '// PCI-DSS Violation detected:',
    snippet: [{ content: 'console.log(`Processing payment for card: ${cardNumber}`);', highlighted: true }],
    analysis:
      'Logging sensitive payment card data violates PCI-DSS requirements and POPIA regulations for South African operations. AI detected this pattern across 3 similar instances.',
    confidence: 96,
    cta: 'Apply AI Fix to All (3)'
  },
  {
    title: 'Missing Rate Limiting on M-Pesa API',
    location: 'src/integrations/mpesa.js - Line 67',
    severity: 'Medium',
    analysis:
      'AI detected missing rate limiting on M-Pesa STK push endpoint. Based on African payment gateway patterns, this could lead to API abuse and increased transaction costs.',
    confidence: 87,
    cta: 'View Suggested Implementation'
  }
];

const severityStyles: Record<Severity, string> = {
  Critical: 'border border-rose-200 bg-rose-50 text-rose-600',
  High: 'border border-orange-200 bg-orange-50 text-orange-600',
  Medium: 'border border-amber-200 bg-amber-50 text-amber-600'
};

const aiMessages = [
  'Initializing AI models...',
  'Learning from your codebase patterns...',
  'Analyzing security vulnerabilities...',
  'Checking African compliance requirements...',
  'Generating fix suggestions...',
  'Finalizing security report...'
];

const aiCompletionMessage = 'Scan complete! Found 18 vulnerabilities with 94% auto-fixable.';

const severityColorMap: Record<string, string> = {
  critical: '#f43f5e',
  high: '#fb7185',
  medium: '#f97316',
  low: '#22c55e',
  informational: '#38bdf8',
  info: '#38bdf8'
};

const formatNumber = (value: number | undefined | null): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return value.toLocaleString();
};

const formatPercent = (value: number | undefined | null, fractionDigits = 1): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return `0%`;
  return `${(value * 100).toFixed(fractionDigits)}%`;
};

const normalizeSeverity = (severity?: string): Severity => {
  const normalized = severity?.toLowerCase() ?? '';
  if (normalized === 'critical') return 'Critical';
  if (normalized === 'high') return 'High';
  return 'Medium';
};

const buildAiCompletionMessage = (response: ComprehensiveScanResponse | null): string => {
  if (!response) return aiCompletionMessage;
  const totalFindings =
    response.executive_summary?.total_findings ?? response.findings?.length ?? response.ai_suggestions?.length ?? 0;
  const aiFindings =
    response.executive_summary?.ai_enhanced_findings ??
    response.ai_intelligence?.security_posture?.ai_enhanced_findings ??
    0;
  return `Scan complete! ${totalFindings} findings, ${aiFindings} AI-enhanced suggestions ready.`;
};

const deepScanPhases = [
  { name: 'Syntax Analysis', detail: '1,247 files processed', icon: '✓' },
  { name: 'Semantic Analysis', detail: '18,392 functions analyzed', icon: '✓' },
  { name: 'Data Flow Analysis', detail: 'Tracing 847 paths...', icon: '⚡' },
  { name: 'Taint Analysis', detail: 'Pending', icon: '🔍' },
  { name: 'Compliance Check', detail: 'Pending', icon: '📋' }
];

const initialPhaseStatuses: PhaseStatus[] = ['completed', 'completed', 'active', 'pending', 'pending'];

const defaultComplianceChecks = [
  { name: 'OWASP Top 10 (2021)', badge: 'pass', status: '8/10 Pass' },
  { name: 'PCI-DSS v4.0', badge: 'fail', status: '3 Violations' },
  { name: 'POPIA (South Africa)', badge: 'pass', status: 'Compliant' },
  { name: 'Kenya DPA', badge: 'warning', status: '2 Warnings' },
  { name: 'Nigeria NDPR', badge: 'pass', status: 'Compliant' }
];

const complianceBadgeStyles: Record<(typeof defaultComplianceChecks)[number]['badge'], string> = {
  pass: 'bg-emerald-500',
  fail: 'bg-rose-500',
  warning: 'bg-amber-400'
};

const defaultScanStatistics = [
  { label: 'Total Lines', value: '48,293' },
  { label: 'Functions', value: '2,847' },
  { label: 'API Endpoints', value: '142' },
  { label: 'Dependencies', value: '87' }
];

const defaultVulnerabilityBreakdown = [
  { label: 'Critical', count: 3, percent: 15, color: '#f97316' },
  { label: 'High', count: 7, percent: 25, color: '#0ea5e9' },
  { label: 'Medium', count: 12, percent: 35, color: '#6366f1' },
  { label: 'Low', count: 8, percent: 25, color: '#22c55e' }
];

const dataFlowNodes = [
  {
    stage: 'Entry Point',
    title: 'POST /api/payment',
    subtitle: 'User input: {amount, cardNumber, cvv}',
    tone: 'info'
  },
  {
    stage: 'Validation Layer',
    title: 'validatePayment()',
    subtitle: '✓ Input sanitization applied',
    tone: 'success'
  },
  {
    stage: 'Vulnerability Detected',
    title: 'processPayment()',
    subtitle: 'Unencrypted data stored in memory',
    tone: 'danger'
  },
  {
    stage: 'Database Layer',
    title: 'db.payments.insert()',
    subtitle: '✓ Parameterized query',
    tone: 'success'
  },
  {
    stage: 'Compliance Issue',
    title: 'logger.info()',
    subtitle: 'PCI-DSS violation: sensitive data logged',
    tone: 'danger'
  }
];

const dataFlowStyles: Record<(typeof dataFlowNodes)[number]['tone'], string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700'
};

const tabOptions = ['Code Flow Analysis', 'Vulnerability Map', 'Dependencies', 'Compliance'];

const primaryButtonClasses =
  'inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButtonClasses =
  'rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900';

const modeCardClasses = (active: boolean) =>
  `w-full rounded-xl border p-4 text-left transition ${
    active
      ? 'border-blue-500/60 bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 shadow-sm'
      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
  }`;

export default function DashboardPage() {
  const [mode, setMode] = useState<ScanMode>('ai');
  const [aiProgress, setAiProgress] = useState<number>(0);
  const [aiMessage, setAiMessage] = useState<string>('Ready to scan your latest import.');
  const [aiIsRunning, setAiIsRunning] = useState<boolean>(false);
  const [phaseStatuses, setPhaseStatuses] = useState<PhaseStatus[]>(initialPhaseStatuses);
  const [aiScanResult, setAiScanResult] = useState<ComprehensiveScanResponse | null>(null);
  const [deepScanResult, setDeepScanResult] = useState<ComprehensiveScanResponse | null>(null);
  const [lastImport, setLastImport] = useState<LastImportRecord | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [deepScanError, setDeepScanError] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const activeUser = {
    name: 'Alex Johnson',
    email: 'alex@shomarsec.com',
    avatarUrl: undefined
  };

  const aiTimerRef = useRef<number | null>(null);
  const deepScanTimerRef = useRef<number | null>(null);

  const canRunScans = useMemo(() => (lastImport?.projects?.length ?? 0) > 0, [lastImport]);

  const includeLanguages = useMemo(() => {
    if (!lastImport?.projects) return [] as string[];
    const set = new Set<string>();
    lastImport.projects.forEach((project) => {
      project.languages?.forEach((language) => {
        if (language) set.add(language.toLowerCase());
      });
    });
    return Array.from(set);
  }, [lastImport]);

  const lastImportSummary = useMemo(() => {
    if (!lastImport) return null;
    const projectCount = lastImport.projects?.length ?? 0;
    const platformLabel = lastImport.platform_name ?? lastImport.platform_id;
    const parsed = new Date(lastImport.timestamp);
    const formatted = Number.isNaN(parsed.valueOf()) ? lastImport.timestamp : parsed.toLocaleString();
    return {
      projectCount,
      platformLabel,
      formatted
    };
  }, [lastImport]);

  const aiMetrics = useMemo(() => {
    if (!aiScanResult) {
      return defaultAiMetrics;
    }

    const scannedFiles =
      aiScanResult.metadata?.scanned_files ?? lastImport?.projects?.length ?? Number(defaultAiMetrics[0].value);
    const totalFindings =
      aiScanResult.executive_summary?.total_findings ?? aiScanResult.findings?.length ?? Number(defaultAiMetrics[1].value);
    const aiEnhanced =
      aiScanResult.executive_summary?.ai_enhanced_findings ??
      aiScanResult.ai_intelligence?.security_posture?.ai_enhanced_findings ??
      0;
    const rawRiskScore = aiScanResult.ai_intelligence?.security_posture?.overall_risk_score;
    const riskScore =
      typeof rawRiskScore === 'number' && !Number.isNaN(rawRiskScore)
        ? rawRiskScore > 1
          ? Math.min(rawRiskScore / 100, 1)
          : rawRiskScore
        : 0.985;
    const aiSuggestions = aiScanResult.ai_suggestions?.length ?? 0;
    const scannedLines = aiScanResult.metadata?.scanned_lines;
    const helperText =
      typeof scannedLines === 'number' && !Number.isNaN(scannedLines)
        ? `${formatNumber(scannedLines)} lines analyzed`
        : lastImport?.projects?.length
        ? `${formatNumber(lastImport.projects.length)} projects prepared`
        : defaultAiMetrics[0].helper;

    return [
      {
        label: 'Files Scanned',
        value: formatNumber(scannedFiles),
        helper: helperText,
        helperClassName: 'text-emerald-600'
      },
      {
        label: 'Vulnerabilities',
        value: formatNumber(totalFindings),
        helper: `${formatNumber(aiEnhanced)} AI-enhanced`,
        valueClassName: totalFindings > 0 ? 'text-rose-600' : 'text-slate-900',
        helperClassName: totalFindings > 0 ? 'text-rose-500' : 'text-emerald-600'
      },
      {
        label: 'AI Confidence',
        value: formatPercent(riskScore, 1),
        helper: aiScanResult.next_gen_features ? 'ML confidence score' : defaultAiMetrics[2].helper,
        helperClassName: 'text-sky-600'
      },
      {
        label: 'Auto-Fixable',
        value: formatPercent((totalFindings > 0 ? Math.min(aiSuggestions / totalFindings, 1) : 0), 0),
        helper: `${formatNumber(aiSuggestions)} AI suggestions`,
        helperClassName: 'text-emerald-600'
      }
    ];
  }, [aiScanResult, lastImport]);

  const vulnerabilities = useMemo(() => {
    const findings = aiScanResult?.findings;
    if (!findings || findings.length === 0) {
      return defaultVulnerabilities;
    }

    return findings.slice(0, 6).map((finding, index) => {
      const severity = normalizeSeverity(finding.severity);
      const rawConfidence = finding.confidence ?? 0.85;
      const confidenceValue = rawConfidence > 1 ? Math.round(rawConfidence) : Math.round(rawConfidence * 100);
      const description =
        finding.description ||
        finding.recommendation ||
        'No detailed description provided. Review the raw finding details in the findings panel.';

      const normalized: Vulnerability = {
        title: finding.title ?? `Finding ${index + 1}`,
        location: finding.location ?? finding.file_path ?? 'Location unavailable',
        severity,
        analysis: description,
        confidence: confidenceValue,
        cta: finding.recommendation ? 'View Recommendation' : 'Review Finding',
        snippet: finding.description
          ? [{ content: finding.description, highlighted: true }]
          : undefined,
        snippetLabel: finding.description ? 'Finding details' : undefined,
        fixSnippetLabel: finding.recommendation ? 'Suggested remediation' : undefined,
        fixSnippet: finding.recommendation ? [finding.recommendation] : undefined
      };

      return normalized;
    });
  }, [aiScanResult]);

  const complianceChecks = useMemo(() => {
    if (!deepScanResult?.compliance_issues?.length) {
      return defaultComplianceChecks;
    }

    const issueCount = deepScanResult.compliance_issues.length;
    return defaultComplianceChecks.map((check, index) =>
      index === 0
        ? {
            ...check,
            badge: issueCount > 0 ? 'rose' : check.badge,
            status: issueCount > 0 ? `${issueCount} compliance gaps detected` : check.status
          }
        : check
    );
  }, [deepScanResult]);

  const scanStatistics = useMemo(() => {
    if (!deepScanResult?.metadata) {
      return defaultScanStatistics;
    }

    return [
      {
        label: 'Repositories',
        value: formatNumber(lastImport?.projects?.length ?? Number(defaultScanStatistics[0].value))
      },
      {
        label: 'Scanned files',
        value: formatNumber(deepScanResult.metadata.scanned_files ?? 0)
      },
      {
        label: 'Scan duration',
        value: `${formatNumber(deepScanResult.metadata.scan_duration ?? 0)}s`
      },
      {
        label: 'Secrets uncovered',
        value: formatNumber(Array.isArray(deepScanResult.secret_exposures) ? deepScanResult.secret_exposures.length : 0)
      }
    ];
  }, [deepScanResult, lastImport]);

  const vulnerabilityBreakdown = useMemo(() => {
    const distribution = deepScanResult?.metadata?.severity_distribution;
    if (!distribution || Object.keys(distribution).length === 0) {
      return defaultVulnerabilityBreakdown;
    }

    const total = Object.values(distribution).reduce((acc, value) => acc + value, 0);
    return Object.entries(distribution).map(([severity, count]) => {
      const lower = severity.toLowerCase();
      return {
        label: severity.charAt(0).toUpperCase() + severity.slice(1),
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        color: severityColorMap[lower] ?? '#64748b'
      };
    });
  }, [deepScanResult]);

  useEffect(() => {
    const record = readLastImport();
    if (record) {
      setLastImport(record);
      if (record.projects.length > 0) {
        const primary = record.projects[0];
        setActiveProject(primary.full_name ?? primary.name ?? null);
        setAiMessage(
          `Ready to scan ${record.projects.length} imported project${record.projects.length === 1 ? '' : 's'}.`
        );
      } else {
        setAiMessage('No projects available for scanning yet.');
      }
    } else {
      setAiMessage('Import projects to unlock scanning.');
    }
  }, []);

  useEffect(() => {
    if (lastImport?.projects?.length) {
      const primary = lastImport.projects[0];
      setActiveProject(primary.full_name ?? primary.name ?? null);
    } else {
      setActiveProject(null);
    }
  }, [lastImport]);

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) {
        window.clearInterval(aiTimerRef.current);
      }
      if (deepScanTimerRef.current) {
        window.clearInterval(deepScanTimerRef.current);
      }
    };
  }, []);

  const startAIScan = async () => {
    if (aiIsRunning) return;
    if (!canRunScans) {
      setScanError('Import at least one project before running an AI scan.');
      return;
    }

    setMode('ai');
    setScanError(null);
    setAiScanResult(null);

    if (aiTimerRef.current) {
      window.clearInterval(aiTimerRef.current);
      aiTimerRef.current = null;
    }

    setAiIsRunning(true);
    setAiProgress(6);
    setAiMessage('Preparing AI engines and context...');
    if (lastImport?.projects?.length) {
      const primary = lastImport.projects[0];
      setActiveProject(primary.full_name ?? primary.name ?? null);
    }

    const aiOptions =
      includeLanguages.length > 0
        ? {
            include_languages: includeLanguages,
            exclude_paths: ['tests/']
          }
        : {
            exclude_paths: ['tests/']
          };

    let response: ComprehensiveScanResponse | null = null;

    try {
      response = await startComprehensiveScan(
        {
          target: '/srv/app',
          options: aiOptions,
          enable_framework_detection: true,
          enable_dependency_scan: true,
          enable_risk_scoring: true,
          include_compliance_mapping: true
        },
        'ai'
      );
      setAiScanResult(response);
    } catch (error) {
      const apiErr = error as ApiError;
      setAiIsRunning(false);
      setAiProgress(0);
      setAiMessage('Unable to start AI scan.');
      setScanError(apiErr?.message || 'The AI scan could not be started. Please try again.');
      return;
    }

    const completionSummary = buildAiCompletionMessage(response);
    setAiMessage(aiMessages[0]);

    aiTimerRef.current = window.setInterval(() => {
      setAiProgress((prev) => {
        const increment = Math.random() * 18 + 7;
        const next = Math.min(prev + increment, 100);
        const messageIndex = Math.min(Math.floor((next / 100) * aiMessages.length), aiMessages.length - 1);

        setAiMessage(aiMessages[messageIndex]);

        if (next >= 100) {
          if (aiTimerRef.current) {
            window.clearInterval(aiTimerRef.current);
            aiTimerRef.current = null;
          }
          setAiIsRunning(false);
          setAiMessage(completionSummary);
          return 100;
        }

        return next;
      });
    }, 900);
  };

  const startDeepScan = async () => {
    setMode('comprehensive');
    if (!canRunScans) {
      setDeepScanError('Import at least one project before running a comprehensive scan.');
      return;
    }

    setDeepScanError(null);
    setDeepScanResult(null);
    if (lastImport?.projects?.length) {
      const primary = lastImport.projects[0];
      setActiveProject(primary.full_name ?? primary.name ?? null);
    }

    if (deepScanTimerRef.current) {
      window.clearInterval(deepScanTimerRef.current);
      deepScanTimerRef.current = null;
    }

    setPhaseStatuses(deepScanPhases.map((_, index) => (index === 0 ? 'active' : 'pending')));

    let response: ComprehensiveScanResponse | null = null;

    try {
      response = await startComprehensiveScan(
        {
          target: '/srv/app',
          options: includeLanguages.length
            ? {
                include_languages: includeLanguages,
                exclude_paths: ['tests/']
              }
            : {
                exclude_paths: ['tests/']
              },
          enable_framework_detection: true,
          enable_dependency_scan: true,
          enable_risk_scoring: true,
          include_compliance_mapping: true
        },
        'standard'
      );
      setDeepScanResult(response);
    } catch (error) {
      const apiErr = error as ApiError;
      setPhaseStatuses(deepScanPhases.map(() => 'pending'));
      setDeepScanError(apiErr?.message || 'The comprehensive scan could not be started. Please try again.');
      return;
    }

    let activeIndex = 0;
    deepScanTimerRef.current = window.setInterval(() => {
      activeIndex += 1;

      setPhaseStatuses(() => {
        if (activeIndex >= deepScanPhases.length) {
          return deepScanPhases.map(() => 'completed');
        }

        return deepScanPhases.map((_, index) => {
          if (index < activeIndex) return 'completed';
          if (index === activeIndex) return 'active';
          return 'pending';
        });
      });

      if (activeIndex >= deepScanPhases.length) {
        if (deepScanTimerRef.current) {
          window.clearInterval(deepScanTimerRef.current);
          deepScanTimerRef.current = null;
        }
      }
    }, 2400);
  };

  const aiView = (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">AI-Powered Security Analysis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time detection with adaptive models tuned for African compliance.
          </p>
          {lastImportSummary ? (
            <p className="mt-2 text-xs text-slate-500">
              Latest import: {lastImportSummary.projectCount} project{lastImportSummary.projectCount === 1 ? '' : 's'} from{' '}
              {lastImportSummary.platformLabel} · {lastImportSummary.formatted}
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Connect a platform and import projects to enable scanning.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={secondaryButtonClasses}>
            Configure
          </button>
          <button
            type="button"
            className={primaryButtonClasses}
            onClick={startAIScan}
            disabled={aiIsRunning || !canRunScans}
            title={!canRunScans ? 'Import at least one project to enable scanning.' : undefined}
          >
            <span>
              {aiIsRunning ? 'Scanning...' : !canRunScans ? 'Import projects to enable' : 'Start AI Scan'}
            </span>
          </button>
        </div>
      </header>

      {scanError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {scanError}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-2xl text-white shadow">
              🤖
            </div>
            <p className="text-sm text-slate-700 sm:text-base">{aiMessage}</p>
          </div>
            <span className="text-xs uppercase tracking-wide text-slate-400">AI SAST Engine</span>
        </div>
        <div className="mt-6">
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.round(aiProgress)}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap justify-between text-xs text-slate-500">
            <span>
              Scanning:{' '}
              {activeProject
                ? activeProject
                : aiIsRunning
                ? 'Preparing repositories...'
                : canRunScans
                ? 'No scan running'
                : 'Awaiting project import'}
            </span>
            <span>{Math.round(aiProgress)}% Complete</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {aiMetrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{metric.label}</p>
            <p className={`mt-3 text-3xl font-semibold sm:text-4xl ${metric.valueClassName ?? 'text-slate-900'}`}>
              {metric.value}
            </p>
            <p className={`mt-3 text-xs ${metric.helperClassName ?? 'text-slate-500'}`}>{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Detected Vulnerabilities</h2>
          <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-600">
            18 issues
          </span>
        </div>

        <div className="space-y-6">
          {vulnerabilities.map((vulnerability) => (
            <article
              key={vulnerability.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{vulnerability.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{vulnerability.location}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-wide ${severityStyles[vulnerability.severity]}`}
                >
                  {vulnerability.severity}
                </span>
              </div>

              {vulnerability.snippet && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                  {vulnerability.snippetLabel && (
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{vulnerability.snippetLabel}</p>
                  )}
                  <div className="mt-3 space-y-1 font-mono text-xs text-slate-800 sm:text-sm">
                    {vulnerability.snippet.map((line, index) => (
                      <div
                        key={`${vulnerability.title}-snippet-${index}`}
                        className={
                          line.highlighted
                            ? '-mx-5 border-l-4 border-rose-300 bg-rose-100 px-5 py-1 text-rose-700'
                            : undefined
                        }
                      >
                        {line.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">🤖 AI Analysis</span>
                  <span className="text-xs text-slate-500">Confidence:</span>
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                      style={{ width: `${vulnerability.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600">{vulnerability.confidence}%</span>
                </div>
                <p className="mt-3 text-sm text-slate-700">{vulnerability.analysis}</p>

                {vulnerability.fixSnippet && (
                  <div className="mt-4 rounded-lg border border-slate-300 bg-slate-900 p-4 font-mono text-xs text-slate-100 sm:text-sm">
                    {vulnerability.fixSnippetLabel && (
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                        {vulnerability.fixSnippetLabel}
                      </p>
                    )}
                    <div className="space-y-1">
                      {vulnerability.fixSnippet.map((line, index) => (
                        <div key={`${vulnerability.title}-fix-${index}`}>{line}</div>
                      ))}
                    </div>
                  </div>
                )}

                <button type="button" className={`${primaryButtonClasses} mt-4`}>
                  {vulnerability.cta}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const comprehensiveView = (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Comprehensive Security Engine</h1>
          <p className="mt-1 text-sm text-slate-500">
            Deep static analysis, taint tracking, and compliance in one workflow.
          </p>
          {lastImportSummary ? (
            <p className="mt-2 text-xs text-slate-500">
              Latest import: {lastImportSummary.projectCount} project{lastImportSummary.projectCount === 1 ? '' : 's'} from{' '}
              {lastImportSummary.platformLabel} · {lastImportSummary.formatted}
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Import projects to activate comprehensive scans.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={secondaryButtonClasses}>
            Export Report
          </button>
          <button
            type="button"
            className={primaryButtonClasses}
            onClick={startDeepScan}
            disabled={!canRunScans}
            title={!canRunScans ? 'Import at least one project to enable comprehensive scans.' : undefined}
          >
            Start Deep Scan
          </button>
        </div>
      </header>

      {deepScanError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {deepScanError}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {deepScanPhases.map((phase, index) => {
            const status = phaseStatuses[index] ?? 'pending';
            const statusClasses =
              status === 'active'
                ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                : status === 'completed'
                ? 'border-blue-300 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white';

            const statusLabel = status === 'active' ? 'Running' : status === 'completed' ? 'Completed' : 'Pending';

            return (
              <div key={phase.name} className={`rounded-xl border p-5 transition ${statusClasses}`}>
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg ${
                    status === 'active'
                      ? 'animate-pulse border-transparent bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow'
                      : ''
                  }`}
                >
                  {status === 'completed' ? '✓' : phase.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{phase.name}</p>
                <p className="mt-2 text-sm text-slate-700">{phase.detail}</p>
                <p className="mt-3 text-xs text-slate-500">{statusLabel}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <nav className="flex flex-wrap gap-5 border-b border-slate-200 pb-2">
          {tabOptions.map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={`border-b-2 pb-2 text-sm font-medium transition ${
                index === 0 ? 'border-blue-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Data Flow Trace: Payment Processing</h3>
            <div className="mt-6 space-y-6">
              {dataFlowNodes.map((node, index) => (
                <div key={node.title}>
                  <div className={`rounded-xl border p-5 transition ${dataFlowStyles[node.tone]}`}>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{node.stage}</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{node.title}</p>
                    <p className="mt-1 text-sm">{node.subtitle}</p>
                  </div>
                  {index < dataFlowNodes.length - 1 && <div className="mx-auto mt-4 h-6 w-px bg-slate-200" aria-hidden />}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Compliance Status</h3>
              <div className="mt-5 space-y-5">
                {complianceChecks.map((check) => (
                  <div
                    key={check.name}
                    className="flex items-center justify-between border-b border-slate-200 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${complianceBadgeStyles[check.badge]}`} />
                      <span className="text-sm text-slate-700">{check.name}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-600">{check.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Scan Statistics</h3>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-slate-600">
                {scanStatistics.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-slate-400">Vulnerability Distribution</p>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full w-full">
                    {vulnerabilityBreakdown.map((segment) => (
                      <div
                        key={segment.label}
                        className="h-full"
                        style={{ width: `${segment.percent}%`, backgroundColor: segment.color }}
                        title={`${segment.label}: ${segment.count}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-between text-[11px] text-slate-500">
                  {vulnerabilityBreakdown.map((segment) => (
                    <span key={`${segment.label}-legend`}>
                      {segment.label}: {segment.count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f7ff] text-slate-900">
      <DashboardSidebar
        mode={mode}
        scanModes={scanModes}
        navItems={navItems}
        onModeSelect={setMode}
        modeCardClasses={modeCardClasses}
      />

      <main className="flex flex-1 flex-col">
        <DashboardHeader user={activeUser} notificationsCount={3} />
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-12 pt-10 sm:px-6 lg:px-12">
            <div className="grid gap-4 lg:hidden">
              {scanModes.map((modeOption) => {
                const isActive = mode === modeOption.id;
                return (
                  <button
                    key={`mobile-${modeOption.id}`}
                    type="button"
                    onClick={() => setMode(modeOption.id)}
                    className={modeCardClasses(isActive)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{modeOption.icon}</span>
                      <span className="text-[11px] uppercase tracking-wide text-slate-400">
                        {isActive ? 'Active' : 'Switch'}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold">{modeOption.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{modeOption.description}</p>
                  </button>
                );
              })}
            </div>

            {mode === 'ai' ? aiView : comprehensiveView}
          </div>
        </div>
      </main>
    </div>
  );
}

