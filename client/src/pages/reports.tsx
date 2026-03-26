import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ComplianceItem, AuditLog } from "@shared/schema";
import { format } from "date-fns";
import {
  FileText, Download, BarChart3, ClipboardCheck, Activity, TrendingUp,
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Clock, XCircle,
  ArrowUpDown, Search, FileSpreadsheet, Presentation, FileDown,
  Loader2, ChevronUp, ChevronDown, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ComplianceData {
  items: ComplianceItem[];
  score: number;
}

type SortDir = "asc" | "desc";

// ─── Risk Matrix Data ────────────────────────────────────────────────────────

const LIKELIHOOD_LABELS = ["Rare", "Unlikely", "Possible", "Likely", "Certain"];
const IMPACT_LABELS = ["Insignificant", "Minor", "Moderate", "Major", "Catastrophic"];

// color map: risk score = likelihood_idx + impact_idx (0-indexed)
// 0-2: low(green), 3-4: medium(yellow), 5-6: high(orange), 7-8: critical(red)
function getRiskColor(li: number, ii: number): string {
  const score = li + ii;
  if (score <= 2) return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900";
  if (score <= 4) return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900";
  if (score <= 6) return "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900";
  return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900";
}

function getRiskLevel(li: number, ii: number): string {
  const score = li + ii;
  if (score <= 2) return "Low";
  if (score <= 4) return "Medium";
  if (score <= 6) return "High";
  return "Critical";
}

// Sample risk items placed on the matrix
const RISK_ITEMS: { name: string; likelihood: number; impact: number }[] = [
  { name: "Phishing attack on staff", likelihood: 4, impact: 3 },
  { name: "Ransomware infection", likelihood: 2, impact: 4 },
  { name: "Student data breach", likelihood: 1, impact: 4 },
  { name: "Unauthorized SIS access", likelihood: 3, impact: 3 },
  { name: "DDoS on school portal", likelihood: 1, impact: 2 },
  { name: "USB malware infection", likelihood: 3, impact: 1 },
  { name: "Insider data theft", likelihood: 1, impact: 4 },
  { name: "Unpatched LMS vulnerability", likelihood: 3, impact: 3 },
  { name: "Lost/stolen staff device", likelihood: 2, impact: 2 },
  { name: "Third-party vendor breach", likelihood: 2, impact: 3 },
  { name: "Social engineering via phone", likelihood: 2, impact: 1 },
  { name: "Weak password exploitation", likelihood: 4, impact: 2 },
];

// ─── Compliance Report Tab ───────────────────────────────────────────────────

function ComplianceReport({ data }: { data: ComplianceData | undefined; isLoading: boolean }) {
  if (!data) return null;

  const { items, score } = data;
  const completed = items.filter((i) => i.status === "completed").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const notStarted = items.filter((i) => i.status === "not_started").length;
  const overdue = items.filter((i) => i.status === "overdue").length;
  const total = items.length;

  const statusColor = score >= 70 ? "text-emerald-600 dark:text-emerald-400" : score >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  const progressColor = score >= 70 ? "[&>div]:bg-emerald-500" : score >= 40 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500";

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Overall Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-4">
              <span className={`text-4xl font-bold ${statusColor}`} data-testid="text-compliance-score">
                {Math.round(score)}%
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                of NDPR requirements met
              </span>
            </div>
            <Progress value={score} className={`h-3 ${progressColor}`} data-testid="progress-compliance-score" />
            <p className="text-xs text-muted-foreground mt-3">
              Based on weighted assessment of {total} NDPR compliance requirements. Updated in real-time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Items by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-bold" data-testid="text-completed-count">{completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Clock className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-bold" data-testid="text-in-progress-count">{inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <XCircle className="h-4.5 w-4.5 text-gray-500" />
                </div>
                <div>
                  <p className="text-lg font-bold" data-testid="text-not-started-count">{notStarted}</p>
                  <p className="text-xs text-muted-foreground">Not Started</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-lg font-bold" data-testid="text-overdue-count">{overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Key Compliance Metrics</CardTitle>
          <CardDescription>NDPR compliance breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => {
              const statusBadge: Record<string, { color: string; label: string }> = {
                completed: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400", label: "Completed" },
                in_progress: { color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400", label: "In Progress" },
                not_started: { color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", label: "Not Started" },
                overdue: { color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400", label: "Overdue" },
              };
              const s = statusBadge[item.status] || statusBadge.not_started;
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Weight: {item.weight}%</p>
                  </div>
                  <Badge className={`${s.color} text-xs shrink-0`}>{s.label}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Risk Matrix Tab ─────────────────────────────────────────────────────────

function RiskMatrix() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            Risk Assessment Matrix
          </CardTitle>
          <CardDescription>
            5×5 likelihood vs. impact risk matrix for school cybersecurity threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Column headers */}
              <div className="grid grid-cols-[120px_repeat(5,1fr)] gap-1 mb-1">
                <div className="text-xs text-muted-foreground font-medium flex items-end justify-center pb-1">
                  Likelihood ↓ / Impact →
                </div>
                {IMPACT_LABELS.map((label) => (
                  <div key={label} className="text-xs text-center font-semibold text-muted-foreground py-1.5">
                    {label}
                  </div>
                ))}
              </div>

              {/* Matrix rows (likelihood from Certain=4 at top to Rare=0 at bottom) */}
              {[...LIKELIHOOD_LABELS].reverse().map((lLabel, reverseIdx) => {
                const li = LIKELIHOOD_LABELS.length - 1 - reverseIdx; // actual index
                return (
                  <div key={lLabel} className="grid grid-cols-[120px_repeat(5,1fr)] gap-1 mb-1">
                    <div className="text-xs font-semibold text-muted-foreground flex items-center justify-end pr-3">
                      {lLabel}
                    </div>
                    {IMPACT_LABELS.map((_, ii) => {
                      const cellRisks = RISK_ITEMS.filter(
                        (r) => r.likelihood === li && r.impact === ii
                      );
                      return (
                        <div
                          key={`${li}-${ii}`}
                          className={`${getRiskColor(li, ii)} border rounded-md p-1.5 min-h-[60px] flex flex-col gap-0.5 text-[10px] leading-tight`}
                          data-testid={`cell-risk-${li}-${ii}`}
                        >
                          {cellRisks.length === 0 && (
                            <span className="opacity-40 text-[9px]">{getRiskLevel(li, ii)}</span>
                          )}
                          {cellRisks.map((r, i) => (
                            <span key={i} className="font-medium">{r.name}</span>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900" />
              <span className="text-xs text-muted-foreground">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-900" />
              <span className="text-xs text-muted-foreground">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-950 border border-orange-200 dark:border-orange-900" />
              <span className="text-xs text-muted-foreground">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-900" />
              <span className="text-xs text-muted-foreground">Critical Risk</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Register Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Risk Register</CardTitle>
          <CardDescription>All identified risks sorted by severity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk</TableHead>
                <TableHead>Likelihood</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...RISK_ITEMS]
                .sort((a, b) => (b.likelihood + b.impact) - (a.likelihood + a.impact))
                .map((risk, i) => {
                  const level = getRiskLevel(risk.likelihood, risk.impact);
                  const levelColor: Record<string, string> = {
                    Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
                    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                    High: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
                    Critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                  };
                  return (
                    <TableRow key={i} data-testid={`row-risk-${i}`}>
                      <TableCell className="font-medium text-sm">{risk.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{LIKELIHOOD_LABELS[risk.likelihood]}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{IMPACT_LABELS[risk.impact]}</TableCell>
                      <TableCell>
                        <Badge className={`${levelColor[level]} text-xs`}>{level}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Audit Trail Tab ─────────────────────────────────────────────────────────

function AuditTrail() {
  const [sortField, setSortField] = useState<"timestamp" | "action" | "entityType">("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: auditEntries = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit/1"],
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  // Unique actions for filter
  const uniqueActions = useMemo(() => {
    const actions = new Set(auditEntries.map((e) => e.action));
    return Array.from(actions).sort();
  }, [auditEntries]);

  // Filter and sort
  const displayed = useMemo(() => {
    let entries = [...auditEntries];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          (e.details || "").toLowerCase().includes(q) ||
          e.entityType.toLowerCase().includes(q)
      );
    }

    // Action filter
    if (actionFilter !== "all") {
      entries = entries.filter((e) => e.action === actionFilter);
    }

    // Sort
    entries.sort((a, b) => {
      let cmp = 0;
      if (sortField === "timestamp") cmp = a.timestamp.localeCompare(b.timestamp);
      else if (sortField === "action") cmp = a.action.localeCompare(b.action);
      else if (sortField === "entityType") cmp = a.entityType.localeCompare(b.entityType);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return entries;
  }, [auditEntries, searchQuery, actionFilter, sortField, sortDir]);

  const actionColors: Record<string, string> = {
    login: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    update_compliance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    create_incident: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    delete: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-audit"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-action">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((a) => (
              <SelectItem key={a} value={a}>
                {a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No audit entries found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      className="flex items-center text-xs font-medium"
                      onClick={() => toggleSort("timestamp")}
                      data-testid="button-sort-timestamp"
                    >
                      Timestamp <SortIcon field="timestamp" />
                    </button>
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center text-xs font-medium"
                      onClick={() => toggleSort("action")}
                      data-testid="button-sort-action"
                    >
                      Action <SortIcon field="action" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center text-xs font-medium"
                      onClick={() => toggleSort("entityType")}
                      data-testid="button-sort-entity-type"
                    >
                      Entity Type <SortIcon field="entityType" />
                    </button>
                  </TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((entry) => (
                  <TableRow key={entry.id} data-testid={`row-audit-${entry.id}`}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.timestamp), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.userId ? `User #${entry.userId}` : "System"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${actionColors[entry.action] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"} text-xs`}>
                        {entry.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{entry.entityType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {entry.details || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Executive Summary Tab ───────────────────────────────────────────────────

function ExecutiveSummary({ complianceData }: { complianceData: ComplianceData | undefined }) {
  const { data: incidents = [] } = useQuery<any[]>({
    queryKey: ["/api/incidents/1"],
  });

  const { data: threats = [] } = useQuery<any[]>({
    queryKey: ["/api/threats"],
  });

  const score = complianceData?.score ?? 0;
  const items = complianceData?.items ?? [];
  const completedItems = items.filter((i) => i.status === "completed").length;
  const activeIncidents = incidents.filter((i: any) => i.status !== "reported").length;
  const criticalThreats = threats.filter((t: any) => t.severity === "critical").length;
  const nigerianThreats = threats.filter((t: any) => t.country === "NG").length;

  const riskRating = score >= 70 ? "Moderate" : score >= 40 ? "High" : "Critical";
  const riskColor = score >= 70 ? "text-amber-600 dark:text-amber-400" : score >= 40 ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-6">
      {/* Board Summary Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Executive Summary — Board Report
              </CardTitle>
              <CardDescription className="mt-1">
                Generated {format(new Date(), "PPPP")} — Federal Government College, Enugu
              </CardDescription>
            </div>
            <Badge className={`${score >= 70 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"} text-xs`}>
              Overall Risk: {riskRating}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none text-sm">
            <p className="leading-relaxed">
              This report provides a high-level overview of the school's cybersecurity posture and NDPR compliance status.
              The current compliance score is <strong className={riskColor}>{Math.round(score)}%</strong>, with
              {" "}<strong>{completedItems}</strong> of {items.length} NDPR requirements fully implemented.
              There are currently <strong>{activeIncidents}</strong> active security incident{activeIncidents !== 1 ? "s" : ""} being
              managed through our 6-step response framework.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Compliance Score</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold" data-testid="text-exec-compliance">{Math.round(score)}%</span>
              <span className="text-xs text-muted-foreground">of requirements</span>
            </div>
            <Progress value={score} className="h-1.5 mt-2 [&>div]:bg-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Incidents</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold" data-testid="text-exec-incidents">{activeIncidents}</span>
              <span className="text-xs text-muted-foreground">in progress</span>
            </div>
            <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${activeIncidents > 0 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, activeIncidents * 33)}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Critical Threats</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-exec-critical-threats">{criticalThreats}</span>
              <span className="text-xs text-muted-foreground">detected</span>
            </div>
            <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(100, criticalThreats * 25)}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Nigeria-Specific Threats</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold" data-testid="text-exec-ng-threats">{nigerianThreats}</span>
              <span className="text-xs text-muted-foreground">targeting NG</span>
            </div>
            <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, nigerianThreats * 15)}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recommended Actions for Board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                priority: "High",
                action: "Complete Data Protection Impact Assessment (DPIA)",
                rationale: "Currently in progress — required under NDPA 2023 for high-risk processing of student data.",
                color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
              },
              {
                priority: "High",
                action: "Execute third-party data processor agreements",
                rationale: "Not started — all EdTech platform vendors must have signed Data Processing Agreements.",
                color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
              },
              {
                priority: "Medium",
                action: "Complete student data inventory and mapping",
                rationale: "Not started — essential for understanding what data is collected, stored, and processed.",
                color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
              },
              {
                priority: "Medium",
                action: "Implement parental consent mechanism for minors",
                rationale: "Not started — NDPA requires verifiable parental consent for processing data of students under 18.",
                color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
              },
              {
                priority: "Low",
                action: "Schedule annual compliance audit",
                rationale: "Plan for comprehensive data protection audit before end of 2025.",
                color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
              },
            ].map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Badge className={`${rec.color} text-xs shrink-0 mt-0.5`}>{rec.priority}</Badge>
                <div>
                  <p className="text-sm font-medium">{rec.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Reports() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("compliance");

  const { data: complianceData, isLoading: complianceLoading } = useQuery<ComplianceData>({
    queryKey: ["/api/compliance/1"],
  });

  const handleExport = (format: string) => {
    toast({
      title: `${format} Export`,
      description: "Export functionality requires backend configuration. This feature will generate downloadable reports once configured.",
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Reports & Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate compliance reports, assess risks, and review audit trails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("PDF")}
            data-testid="button-export-pdf"
          >
            <FileDown className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("Excel")}
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("PowerPoint")}
            data-testid="button-export-pptx"
          >
            <Presentation className="h-4 w-4 mr-1.5" />
            PowerPoint
          </Button>
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "compliance",
            title: "NDPR Compliance Report",
            description: "Full compliance status and gap analysis",
            icon: ClipboardCheck,
            iconColor: "text-emerald-500",
            bgColor: "bg-emerald-100 dark:bg-emerald-950",
          },
          {
            id: "risk",
            title: "Risk Assessment Matrix",
            description: "5×5 likelihood vs. impact grid",
            icon: ShieldAlert,
            iconColor: "text-orange-500",
            bgColor: "bg-orange-100 dark:bg-orange-950",
          },
          {
            id: "audit",
            title: "Audit Trail",
            description: "System activity and change log",
            icon: Activity,
            iconColor: "text-blue-500",
            bgColor: "bg-blue-100 dark:bg-blue-950",
          },
          {
            id: "executive",
            title: "Executive Summary",
            description: "Board-ready overview report",
            icon: TrendingUp,
            iconColor: "text-purple-500",
            bgColor: "bg-purple-100 dark:bg-purple-950",
          },
        ].map((report) => {
          const Icon = report.icon;
          const isActive = activeTab === report.id;
          return (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "ring-2 ring-emerald-500/50 shadow-md" : ""}`}
              onClick={() => setActiveTab(report.id)}
              data-testid={`card-report-${report.id}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg ${report.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4.5 w-4.5 ${report.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{report.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-reports">
          <TabsTrigger value="compliance" data-testid="tab-compliance">
            <ClipboardCheck className="h-4 w-4 mr-1.5 hidden sm:block" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="risk" data-testid="tab-risk">
            <ShieldAlert className="h-4 w-4 mr-1.5 hidden sm:block" />
            Risk Matrix
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <Activity className="h-4 w-4 mr-1.5 hidden sm:block" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="executive" data-testid="tab-executive">
            <TrendingUp className="h-4 w-4 mr-1.5 hidden sm:block" />
            Executive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="mt-6">
          {complianceLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ComplianceReport data={complianceData} isLoading={complianceLoading} />
          )}
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <RiskMatrix />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditTrail />
        </TabsContent>

        <TabsContent value="executive" className="mt-6">
          <ExecutiveSummary complianceData={complianceData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
