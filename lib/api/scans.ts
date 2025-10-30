import { post } from "@/lib/api/http";

export type ComprehensiveScanOptions = {
  include_languages?: string[];
  exclude_paths?: string[];
};

export type ComprehensiveScanRequest = {
  target: string;
  options?: ComprehensiveScanOptions;
  enable_framework_detection?: boolean;
  enable_dependency_scan?: boolean;
  enable_risk_scoring?: boolean;
  include_compliance_mapping?: boolean;
};

export type AiIntelligenceSummary = {
  security_posture?: {
    overall_risk_score?: number;
    ai_enhanced_findings?: number;
    traditional_findings?: number;
    cfg_vulnerabilities?: number;
  };
  ai_capabilities_used?: {
    secure_code_generation?: number;
    behavioral_analysis?: number;
    zero_day_detection?: number;
    cfg_analysis?: number;
  };
  threat_landscape?: {
    supply_chain_risks?: number;
    novel_vulnerabilities?: number;
    data_flow_vulnerabilities?: number;
    code_quality_issues?: number;
  };
};

export type ComprehensiveScanFinding = {
  id?: string;
  title?: string;
  description?: string;
  recommendation?: string;
  file_path?: string;
  location?: string;
  severity?: string;
  confidence?: number;
  [key: string]: unknown;
};

export type ComprehensiveScanRecommendation = {
  type?: string;
  title?: string;
  description?: string;
  priority?: string;
};

export type ComprehensiveScanMetadata = {
  scan_time?: string;
  scan_duration?: number;
  scanned_files?: number;
  scanned_lines?: number;
  scan_types?: string[];
  severity_distribution?: Record<string, number>;
};

export type ComprehensiveScanResponse = {
  scan_id?: string;
  status?: string;
  message?: string;
  target?: string;
  timestamp?: string;
  started_at?: string;
  findings?: ComprehensiveScanFinding[];
  ai_powered_analysis?: boolean;
  ai_intelligence?: AiIntelligenceSummary;
  ai_suggestions?: Array<{ title?: string; description?: string; severity?: string }>;
  behavioral_anomalies?: unknown[];
  zero_day_patterns?: unknown[];
  cfg_findings?: unknown[];
  next_gen_features?: Record<string, string>;
  executive_summary?: {
    total_findings?: number;
    ai_enhanced_findings?: number;
    critical_recommendations?: string[];
  };
  dependency_vulnerabilities?: unknown[];
  secret_exposures?: unknown[];
  compliance_issues?: unknown[];
  language_analysis?: Record<string, unknown>;
  recommendations?: ComprehensiveScanRecommendation[];
  metadata?: ComprehensiveScanMetadata;
  [key: string]: unknown;
};

type ScanMode = "standard" | "ai";

const ENDPOINTS: Record<ScanMode, string> = {
  standard: "/api/v1/sast/scan/comprehensive",
  ai: "/api/v1/sast/ai/comprehensive-analysis",
};

export async function startComprehensiveScan(
  body: ComprehensiveScanRequest,
  mode: ScanMode = "ai"
): Promise<ComprehensiveScanResponse> {
  const path = ENDPOINTS[mode] ?? ENDPOINTS.ai;
  return post<ComprehensiveScanResponse, ComprehensiveScanRequest>(path, body);
}
