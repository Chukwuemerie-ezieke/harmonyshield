import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Weight,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ComplianceItem } from "@shared/schema";

// ──────────── Circular Gauge ────────────
function CircularGauge({
  value,
  size = 160,
  strokeWidth = 14,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  // Color gradient based on score
  let color = "hsl(0, 84%, 60%)"; // red
  if (value >= 70) color = "hsl(160, 84%, 39%)"; // emerald
  else if (value >= 40) color = "hsl(38, 92%, 50%)"; // amber

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(220, 14%, 92%)"
          strokeWidth={strokeWidth}
          className="dark:stroke-[hsl(222,20%,18%)]"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold leading-none">{value}%</span>
        <span className="text-xs text-muted-foreground mt-1">NDPR Score</span>
      </div>
    </div>
  );
}

// ──────────── Status helpers ────────────
type ComplianceStatus = "not_started" | "in_progress" | "completed" | "overdue";

const statusConfig: Record<ComplianceStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  not_started: {
    label: "Not Started",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
    icon: XCircle,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as ComplianceStatus] ?? statusConfig.not_started;
  return (
    <Badge variant="outline" className={`text-[11px] font-medium border-0 ${config.className}`}>
      {config.label}
    </Badge>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// ──────────── Stacked Progress Bar ────────────
function ProgressBreakdown({ items }: { items: ComplianceItem[] }) {
  const counts = {
    completed: items.filter((i) => i.status === "completed").length,
    in_progress: items.filter((i) => i.status === "in_progress").length,
    overdue: items.filter((i) => i.status === "overdue").length,
    not_started: items.filter((i) => i.status === "not_started").length,
  };
  const total = items.length || 1;

  const segments = [
    { key: "completed", color: "bg-emerald-500", count: counts.completed, label: "Completed" },
    { key: "in_progress", color: "bg-amber-500", count: counts.in_progress, label: "In Progress" },
    { key: "overdue", color: "bg-red-500", count: counts.overdue, label: "Overdue" },
    { key: "not_started", color: "bg-gray-300 dark:bg-gray-600", count: counts.not_started, label: "Not Started" },
  ];

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {segments.map((seg) =>
          seg.count > 0 ? (
            <div
              key={seg.key}
              className={`${seg.color} transition-all duration-500`}
              style={{ width: `${(seg.count / total) * 100}%` }}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${seg.color}`} />
            <span className="text-[11px] text-muted-foreground">
              {seg.label}: {seg.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────── Expandable Checklist Row ────────────
function ChecklistRow({
  item,
  isExpanded,
  onToggle,
  onStatusChange,
  isUpdating,
}: {
  item: ComplianceItem;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: number, status: string) => void;
  isUpdating: boolean;
}) {
  const config = statusConfig[item.status as ComplianceStatus] ?? statusConfig.not_started;
  const StatusIcon = config.icon;

  return (
    <div
      className={`border rounded-lg transition-colors ${
        isExpanded ? "border-primary/20 bg-muted/30" : "hover:bg-muted/20"
      }`}
      data-testid={`row-compliance-${item.id}`}
    >
      {/* Main Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        data-testid={`button-expand-${item.id}`}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <StatusIcon className={`h-4 w-4 shrink-0 ${config.className.split(" ").find(c => c.startsWith("text-")) ?? "text-muted-foreground"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">{item.title}</p>
          {!isExpanded && item.description && (
            <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{item.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={item.status} />
          <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
            {item.weight}%
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-11 space-y-3 border-t mx-4 pt-3">
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Due Date</p>
                <p className="text-xs font-medium">{formatDate(item.dueDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Assigned To</p>
                <p className="text-xs font-medium">{item.assignedTo || "Unassigned"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Weight className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Weight</p>
                <p className="text-xs font-medium">{item.weight}%</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Evidence</p>
                <p className="text-xs font-medium">{item.evidenceUrl ? "Attached" : "None"}</p>
              </div>
            </div>
          </div>

          {/* Status update */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground uppercase font-medium mb-1 block">
                Update Status
              </label>
              <Select
                value={item.status}
                onValueChange={(val) => onStatusChange(item.id, val)}
                disabled={isUpdating}
              >
                <SelectTrigger className="h-8 text-xs" data-testid={`select-status-${item.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground uppercase font-medium mb-1 block">
                Notes
              </label>
              <Textarea
                className="text-xs min-h-[60px]"
                placeholder="Add notes or evidence details..."
                defaultValue={item.notes ?? ""}
                data-testid={`textarea-notes-${item.id}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────── Main Component ────────────
interface ComplianceData {
  items: ComplianceItem[];
  score: number;
}

export default function Compliance() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<ComplianceData>({
    queryKey: ["/api/compliance/1"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/compliance/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/1"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/1"] });
      toast({ title: "Status updated", description: "Compliance item status has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const items = data?.items ?? [];
  const score = data?.score ?? 0;

  const filteredItems =
    activeTab === "all" ? items : items.filter((i) => i.status === activeTab);

  const handleStatusChange = (id: number, status: string) => {
    updateMutation.mutate({ id, status });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
          <ClipboardCheck className="h-5 w-5 text-emerald-500" />
          NDPR Compliance
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Nigeria Data Protection Regulation compliance checklist
        </p>
      </div>

      {/* ── Score + Breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1" data-testid="card-compliance-score">
          <CardContent className="pt-6 pb-4 flex flex-col items-center">
            {isLoading ? (
              <Skeleton className="h-[160px] w-[160px] rounded-full" />
            ) : (
              <CircularGauge value={score} />
            )}
            <p className="text-sm font-medium mt-3">Overall Compliance</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {items.filter((i) => i.status === "completed").length} of {items.length} items completed
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2" data-testid="card-progress-breakdown">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Progress Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-full rounded-full" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-3 w-20" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <ProgressBreakdown items={items} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {(["completed", "in_progress", "not_started", "overdue"] as ComplianceStatus[]).map((status) => {
                    const config = statusConfig[status];
                    const count = items.filter((i) => i.status === status).length;
                    return (
                      <div key={status} className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-[11px] text-muted-foreground">{config.label}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Filter Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-compliance-filter">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({items.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({items.filter((i) => i.status === "completed").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="tab-in-progress">
            In Progress ({items.filter((i) => i.status === "in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="not_started" data-testid="tab-not-started">
            Not Started ({items.filter((i) => i.status === "not_started").length})
          </TabsTrigger>
          <TabsTrigger value="overdue" data-testid="tab-overdue">
            Overdue ({items.filter((i) => i.status === "overdue").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Checklist ── */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onStatusChange={handleStatusChange}
              isUpdating={updateMutation.isPending}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No compliance items match the selected filter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
