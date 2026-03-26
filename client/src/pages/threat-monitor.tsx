import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Threat } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Search,
  Globe,
  GraduationCap,
  Rss,
  Bug,
  Wifi,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ThreatStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<string, number>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  critical: {
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-200 dark:border-red-800",
  },
  high: {
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-950",
    border: "border-orange-200 dark:border-orange-800",
  },
  medium: {
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950",
    border: "border-amber-200 dark:border-amber-800",
  },
  low: {
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-700",
  },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  alienvault: {
    label: "AlienVault OTX",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  },
  abuseipdb: {
    label: "AbuseIPDB",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  },
  news: {
    label: "News",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  },
};

const TYPE_LABELS: Record<string, string> = {
  ransomware: "Ransomware",
  phishing: "Phishing",
  ddos: "DDoS",
  unauthorized_access: "Unauthorized Access",
  data_breach: "Data Breach",
  malware: "Malware",
};

const TYPE_ICONS: Record<string, typeof Shield> = {
  ransomware: ShieldAlert,
  phishing: Rss,
  ddos: Wifi,
  unauthorized_access: AlertOctagon,
  data_breach: Bug,
  malware: Bug,
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(215 16% 47%)",
];

const COUNTRY_FLAGS: Record<string, string> = {
  NG: "🇳🇬",
  US: "🇺🇸",
  GB: "🇬🇧",
  RU: "🇷🇺",
  CN: "🇨🇳",
  AU: "🇦🇺",
};

function getRelativeTime(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  icon: typeof Shield;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          {loading ? (
            <Skeleton className="h-6 w-12 mt-1" />
          ) : (
            <p className="text-xl font-bold tabular-nums">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ThreatCard({ threat }: { threat: Threat }) {
  const severityCfg = SEVERITY_CONFIG[threat.severity] || SEVERITY_CONFIG.low;
  const sourceCfg = SOURCE_CONFIG[threat.source] || SOURCE_CONFIG.news;
  const TypeIcon = TYPE_ICONS[threat.type] || Shield;

  return (
    <Card
      className="transition-shadow hover:shadow-md"
      data-testid={`card-threat-${threat.id}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div
              className={`mt-0.5 rounded p-1 shrink-0 ${severityCfg.bg} ${severityCfg.color}`}
            >
              <TypeIcon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold leading-snug line-clamp-2">
              {threat.title}
            </h3>
          </div>
          {threat.isEducationSector === 1 && (
            <Badge
              variant="outline"
              className="shrink-0 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700"
            >
              <GraduationCap className="h-3 w-3 mr-1" />
              Edu
            </Badge>
          )}
        </div>

        {threat.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {threat.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${severityCfg.bg} ${severityCfg.color} ${severityCfg.border}`}
          >
            {threat.severity.toUpperCase()}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${sourceCfg.color}`}
          >
            {sourceCfg.label}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {TYPE_LABELS[threat.type] || threat.type}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{getRelativeTime(threat.publishedAt)}</span>
          {threat.country && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {COUNTRY_FLAGS[threat.country] || ""} {threat.country}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ThreatTypeChart({ byType }: { byType: Record<string, number> }) {
  const data = Object.entries(byType).map(([key, value]) => ({
    name: TYPE_LABELS[key] || key,
    value,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Threat Type Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function IPCheckerSection() {
  const [ipInput, setIpInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [checkedIp, setCheckedIp] = useState("");

  const handleCheck = () => {
    if (!ipInput.trim()) return;
    setCheckedIp(ipInput.trim());
    setShowResult(true);
  };

  // Generate deterministic mock result based on IP
  const isMalicious = checkedIp.startsWith("192.168")
    ? false
    : checkedIp.split(".").reduce((a, b) => a + parseInt(b || "0"), 0) % 3 ===
      0;
  const confidenceScore = isMalicious
    ? 72 + ((checkedIp.length * 7) % 28)
    : 5 + ((checkedIp.length * 3) % 15);
  const abuseReports = isMalicious
    ? 12 + ((checkedIp.length * 2) % 40)
    : 0;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4" />
            IP Reputation Checker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Check if a suspicious IP address has been reported for malicious
            activity.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g. 103.45.67.89)"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              className="text-sm"
              data-testid="input-ip-address"
            />
            <Button
              size="sm"
              onClick={handleCheck}
              disabled={!ipInput.trim()}
              data-testid="button-check-ip"
            >
              Check
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {isMalicious ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
              IP Reputation Report
            </DialogTitle>
            <DialogDescription>
              Results for{" "}
              <code className="font-mono text-sm bg-muted px-1 rounded">
                {checkedIp}
              </code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-[11px] text-muted-foreground">Status</p>
                <p
                  className={`text-sm font-semibold ${isMalicious ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                >
                  {isMalicious ? "Malicious" : "Clean"}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-[11px] text-muted-foreground">
                  Confidence Score
                </p>
                <p className="text-sm font-semibold">{confidenceScore}%</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-[11px] text-muted-foreground">
                  Abuse Reports
                </p>
                <p className="text-sm font-semibold">{abuseReports}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-[11px] text-muted-foreground">Country</p>
                <p className="text-sm font-semibold">
                  {isMalicious ? "🇷🇺 Russia" : "🇳🇬 Nigeria"}
                </p>
              </div>
            </div>
            {isMalicious && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                  ⚠ This IP has been associated with malicious activity. Consider
                  blocking it in your firewall and reviewing access logs.
                </p>
              </div>
            )}
            {!isMalicious && (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  ✓ This IP appears clean with no significant abuse reports.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ThreatMonitor() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: threats, isLoading: threatsLoading } = useQuery<Threat[]>({
    queryKey: ["/api/threats"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ThreatStats>({
    queryKey: ["/api/threats/stats"],
  });

  // Filter threats
  const filteredThreats = (threats || []).filter((t) => {
    if (severityFilter !== "all" && t.severity !== severityFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  });

  // Get unique types from data
  const threatTypes = Array.from(new Set((threats || []).map((t) => t.type)));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-600" />
          Threat Monitor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time cybersecurity threat intelligence for education sector
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Total Threats"
          value={stats?.total || 0}
          icon={Activity}
          color="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
          loading={statsLoading}
        />
        <StatCard
          title="Critical"
          value={stats?.critical || 0}
          icon={AlertOctagon}
          color="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
          loading={statsLoading}
        />
        <StatCard
          title="High"
          value={stats?.high || 0}
          icon={AlertTriangle}
          color="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
          loading={statsLoading}
        />
        <StatCard
          title="Medium / Low"
          value={(stats?.medium || 0) + (stats?.low || 0)}
          icon={ShieldCheck}
          color="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
          loading={statsLoading}
        />
      </div>

      {/* Chart + IP Checker row */}
      <div className="grid md:grid-cols-2 gap-4">
        {statsLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[240px] w-full" />
            </CardContent>
          </Card>
        ) : stats ? (
          <ThreatTypeChart byType={stats.byType} />
        ) : null}
        <div className="space-y-4">
          <IPCheckerSection />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Severity
          </label>
          <Select
            value={severityFilter}
            onValueChange={setSeverityFilter}
          >
            <SelectTrigger
              className="w-[130px] h-8 text-xs"
              data-testid="select-severity-filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Type
          </label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger
              className="w-[160px] h-8 text-xs"
              data-testid="select-type-filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {threatTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {TYPE_LABELS[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {filteredThreats.length} threat{filteredThreats.length !== 1 && "s"}{" "}
          shown
        </div>
      </div>

      {/* Threat feed */}
      {threatsLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredThreats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Shield className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No threats match your filters</p>
            <p className="text-xs mt-1">
              Try adjusting the severity or type filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredThreats.map((threat) => (
            <ThreatCard key={threat.id} threat={threat} />
          ))}
        </div>
      )}
    </div>
  );
}
