import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Incident } from "@shared/schema";
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from "date-fns";
import {
  AlertTriangle, Plus, ChevronRight, Clock, Shield, Search, Eye,
  CheckCircle2, Circle, ArrowRight, AlertCircle, Bug, Wifi, UserX,
  Lock, Users, X, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

// ─── Constants ───────────────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  { value: "ransomware", label: "Ransomware" },
  { value: "phishing", label: "Phishing" },
  { value: "data_breach", label: "Data Breach" },
  { value: "unauthorized_access", label: "Unauthorized Access" },
  { value: "ddos", label: "DDoS" },
  { value: "insider_threat", label: "Insider Threat" },
] as const;

const SEVERITY_LEVELS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

const STEPS = [
  { num: 1, name: "Detect", status: "detected", description: "Identify and confirm the security incident. Gather initial indicators of compromise." },
  { num: 2, name: "Contain", status: "contained", description: "Isolate affected systems to prevent further damage. Implement short-term containment measures." },
  { num: 3, name: "Investigate", status: "investigating", description: "Determine the root cause, scope, and impact. Collect and preserve evidence." },
  { num: 4, name: "Remediate", status: "remediating", description: "Remove the threat and fix vulnerabilities. Apply patches and security updates." },
  { num: 5, name: "Recover", status: "recovering", description: "Restore affected systems from clean backups. Verify system integrity before going live." },
  { num: 6, name: "Report to NDPC", status: "reported", description: "File incident report with NDPC within 72 hours. Document lessons learned." },
];

const TYPE_COLORS: Record<string, string> = {
  ransomware: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  phishing: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  data_breach: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  unauthorized_access: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  ddos: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  insider_threat: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const TYPE_ICONS: Record<string, typeof Lock> = {
  ransomware: Lock,
  phishing: Bug,
  data_breach: Shield,
  unauthorized_access: UserX,
  ddos: Wifi,
  insider_threat: Users,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-emerald-500 text-white",
};

const PLAYBOOKS: Record<string, string[]> = {
  ransomware: [
    "Disconnect affected systems from the network immediately",
    "Do NOT pay the ransom — contact law enforcement",
    "Identify the ransomware variant (check ransom note, file extensions)",
    "Check for clean backups before the infection date",
    "Scan all systems for persistence mechanisms",
    "Reset all passwords after remediation",
  ],
  phishing: [
    "Reset credentials for any compromised accounts",
    "Check email forwarding rules for malicious redirects",
    "Scan for lateral movement from the compromised account",
    "Block the sender and report the phishing URL",
    "Alert all staff about the phishing campaign",
    "Review MFA status on affected accounts",
  ],
  data_breach: [
    "Identify what data was accessed or exfiltrated",
    "Determine the number of affected data subjects",
    "Preserve all logs and evidence",
    "Notify affected individuals as required by NDPA",
    "File NDPC breach notification within 72 hours",
    "Engage legal counsel for regulatory compliance",
  ],
  unauthorized_access: [
    "Disable compromised accounts immediately",
    "Review access logs for the affected period",
    "Check for privilege escalation attempts",
    "Rotate API keys and access tokens",
    "Strengthen authentication (enable MFA)",
    "Review and tighten access control policies",
  ],
  ddos: [
    "Activate DDoS mitigation services",
    "Identify attack vectors (volumetric, protocol, application)",
    "Implement rate limiting and traffic filtering",
    "Contact ISP for upstream filtering support",
    "Monitor for secondary attacks during the DDoS",
    "Document attack characteristics for future prevention",
  ],
  insider_threat: [
    "Preserve evidence before alerting the suspect",
    "Review all access logs for the individual",
    "Disable accounts and revoke physical access",
    "Conduct forensic analysis of the suspect's devices",
    "Interview relevant personnel with HR present",
    "Report to law enforcement if criminal activity is confirmed",
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function NdpcCountdown({ createdAt }: { createdAt: string }) {
  const created = new Date(createdAt);
  const deadline = new Date(created.getTime() + 72 * 60 * 60 * 1000);
  const now = new Date();
  const hoursLeft = differenceInHours(deadline, now);
  const minutesLeft = differenceInMinutes(deadline, now) % 60;
  const isOverdue = now > deadline;
  const totalHours = 72;
  const elapsed = Math.max(0, totalHours - hoursLeft);
  const pct = Math.min(100, (elapsed / totalHours) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Clock className="h-4 w-4" />
          72-Hour NDPC Notification Deadline
        </span>
        {isOverdue ? (
          <Badge variant="destructive" className="text-xs">OVERDUE</Badge>
        ) : (
          <span className={hoursLeft < 12 ? "text-red-600 dark:text-red-400 font-semibold" : "text-muted-foreground"}>
            {hoursLeft}h {minutesLeft}m remaining
          </span>
        )}
      </div>
      <Progress
        value={pct}
        className={`h-2 ${isOverdue ? "[&>div]:bg-red-600" : hoursLeft < 12 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
        data-testid="progress-ndpc-deadline"
      />
      <p className="text-xs text-muted-foreground">
        Deadline: {format(deadline, "PPpp")} — Under NDPA 2023, data breaches must be reported to the NDPC within 72 hours.
      </p>
    </div>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center w-full" data-testid="step-indicator">
      {STEPS.map((step, i) => {
        const isCompleted = currentStep > step.num;
        const isCurrent = currentStep === step.num;
        const isFuture = currentStep < step.num;

        return (
          <div key={step.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                  ${isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : ""}
                  ${isCurrent ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400" : ""}
                  ${isFuture ? "bg-muted border-muted-foreground/30 text-muted-foreground/50" : ""}
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <span className="text-xs font-bold">{step.num}</span>
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium text-center leading-tight whitespace-nowrap
                  ${isCompleted ? "text-emerald-600 dark:text-emerald-400" : ""}
                  ${isCurrent ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}
                  ${isFuture ? "text-muted-foreground/50" : ""}
                `}
              >
                {step.name}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1.5 mt-[-1.25rem] rounded-full
                  ${currentStep > step.num + 1 ? "bg-emerald-500" : ""}
                  ${currentStep === step.num + 1 ? "bg-emerald-500/50" : ""}
                  ${currentStep <= step.num ? "bg-muted-foreground/20" : ""}
                  ${currentStep === step.num ? "bg-gradient-to-r from-emerald-500/50 to-muted-foreground/20" : ""}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Incident Detail Panel ───────────────────────────────────────────────────

function IncidentDetail({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const { toast } = useToast();
  const TypeIcon = TYPE_ICONS[incident.type] || AlertTriangle;

  const advanceMutation = useMutation({
    mutationFn: async () => {
      const nextStep = Math.min(incident.step + 1, 6);
      const nextStatus = STEPS[nextStep - 1].status;
      const body: Record<string, unknown> = { step: nextStep, status: nextStatus };
      if (nextStep === 6) body.resolvedAt = new Date().toISOString();
      const res = await apiRequest("PUT", `/api/incidents/${incident.id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents/1"] });
      toast({ title: "Step advanced", description: `Incident moved to ${STEPS[Math.min(incident.step, 5)].name}` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const currentStepInfo = STEPS[incident.step - 1];
  const playbook = PLAYBOOKS[incident.type] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${TYPE_COLORS[incident.type]} flex-shrink-0`}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{formatType(incident.type)} Incident</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Reported by {incident.reportedBy} — {format(new Date(incident.createdAt), "PPp")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={SEVERITY_COLORS[incident.severity]}>{incident.severity}</Badge>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-detail">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm leading-relaxed">{incident.description}</p>

      {incident.affectedSystems && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Affected Systems:</span>
          <Badge variant="outline">{incident.affectedSystems}</Badge>
        </div>
      )}

      <Separator />

      {/* NDPC Countdown */}
      {incident.status !== "reported" && (
        <NdpcCountdown createdAt={incident.createdAt} />
      )}
      {incident.status === "reported" && incident.resolvedAt && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Incident resolved and reported to NDPC — {format(new Date(incident.resolvedAt), "PPp")}
        </div>
      )}

      <Separator />

      {/* Step Indicator */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Response Progress</h4>
        <StepIndicator currentStep={incident.step} />
      </div>

      {/* Current Step Detail */}
      {currentStepInfo && (
        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500 text-white">Step {currentStepInfo.num}</Badge>
              <span className="font-semibold text-sm">{currentStepInfo.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">{currentStepInfo.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Advance Button */}
      {incident.step < 6 && (
        <Button
          onClick={() => advanceMutation.mutate()}
          disabled={advanceMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          data-testid="button-advance-step"
        >
          {advanceMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          Advance to {STEPS[incident.step]?.name || "Next Step"}
        </Button>
      )}

      <Separator />

      {/* Playbook */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          {formatType(incident.type)} Response Playbook
        </h4>
        <div className="space-y-2">
          {playbook.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium mt-0.5">
                {i + 1}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── New Incident Form ───────────────────────────────────────────────────────

function NewIncidentForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [affectedSystems, setAffectedSystems] = useState("");
  const [reportedBy, setReportedBy] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/incidents", {
        schoolId: 1,
        type,
        severity,
        description,
        affectedSystems: affectedSystems || null,
        reportedBy,
        status: "detected",
        step: 1,
        affectedCount: 0,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents/1"] });
      toast({ title: "Incident reported", description: "New incident has been created and is now in detection phase." });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = type && severity && description.trim() && reportedBy.trim();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="incident-type">Incident Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="incident-type" data-testid="select-incident-type">
            <SelectValue placeholder="Select incident type" />
          </SelectTrigger>
          <SelectContent>
            {INCIDENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} data-testid={`option-type-${t.value}`}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="incident-severity">Severity</Label>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger id="incident-severity" data-testid="select-incident-severity">
            <SelectValue placeholder="Select severity level" />
          </SelectTrigger>
          <SelectContent>
            {SEVERITY_LEVELS.map((s) => (
              <SelectItem key={s.value} value={s.value} data-testid={`option-severity-${s.value}`}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="incident-description">Description</Label>
        <Textarea
          id="incident-description"
          placeholder="Describe what happened, when it was noticed, and any immediate actions taken..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          data-testid="textarea-incident-description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="incident-systems">Affected Systems</Label>
        <Input
          id="incident-systems"
          placeholder="e.g. Student Information System, Google Workspace"
          value={affectedSystems}
          onChange={(e) => setAffectedSystems(e.target.value)}
          data-testid="input-affected-systems"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="incident-reporter">Reporter Name</Label>
        <Input
          id="incident-reporter"
          placeholder="Your full name"
          value={reportedBy}
          onChange={(e) => setReportedBy(e.target.value)}
          data-testid="input-reporter-name"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onClose} data-testid="button-cancel-incident">
          Cancel
        </Button>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit || createMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          data-testid="button-submit-incident"
        >
          {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Report Incident
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function IncidentResponse() {
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: incidentsList = [], isLoading } = useQuery<Incident[]>({
    queryKey: ["/api/incidents/1"],
  });

  // Apply filters
  const filtered = incidentsList.filter((inc) => {
    if (filterType !== "all" && inc.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inc.description.toLowerCase().includes(q) ||
        inc.reportedBy.toLowerCase().includes(q) ||
        (inc.affectedSystems || "").toLowerCase().includes(q) ||
        inc.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const activeCount = incidentsList.filter((i) => i.status !== "reported").length;
  const criticalCount = incidentsList.filter((i) => i.severity === "critical" && i.status !== "reported").length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Incident Response
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            6-step incident response workflow aligned with NDPA 2023 breach notification requirements
          </p>
        </div>
        <Button
          onClick={() => setNewDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          data-testid="button-report-new-incident"
        >
          <Plus className="h-4 w-4 mr-2" />
          Report New Incident
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Incidents</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-total-incidents">{incidentsList.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Incidents</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-active-incidents">{activeCount}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Critical Active</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400" data-testid="text-critical-incidents">{criticalCount}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-incidents"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {INCIDENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Two-column layout: table + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Incident Table */}
        <Card className={selectedIncident ? "lg:col-span-2" : "lg:col-span-5"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Incidents</CardTitle>
            <CardDescription>{filtered.length} incident{filtered.length !== 1 ? "s" : ""} found</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Shield className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No incidents found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Adjust your filters or report a new incident</p>
              </div>
            ) : selectedIncident ? (
              /* Compact list view when detail is open */
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filtered.map((inc) => {
                  const Icon = TYPE_ICONS[inc.type] || AlertTriangle;
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <button
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 ${isSelected ? "bg-muted/70" : ""}`}
                      data-testid={`button-incident-row-${inc.id}`}
                    >
                      <div className={`p-1.5 rounded ${TYPE_COLORS[inc.type]} flex-shrink-0`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{formatType(inc.type)}</span>
                          <Badge className={`${SEVERITY_COLORS[inc.severity]} text-[10px] px-1.5 py-0`}>{inc.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{inc.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Full table view when no detail is selected */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Reporter</TableHead>
                      <TableHead className="hidden lg:table-cell">Affected Systems</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inc) => {
                      const Icon = TYPE_ICONS[inc.type] || AlertTriangle;
                      const stepInfo = STEPS[inc.step - 1];
                      return (
                        <TableRow
                          key={inc.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedIncident(inc)}
                          data-testid={`row-incident-${inc.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${TYPE_COLORS[inc.type]}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-medium whitespace-nowrap">{formatType(inc.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${SEVERITY_COLORS[inc.severity]} text-xs`}>{inc.severity}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${inc.status === "reported" ? "bg-emerald-500" : "bg-amber-500"}`} />
                              <span className="text-sm capitalize">{stepInfo?.name || inc.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {inc.reportedBy}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {inc.affectedSystems && (
                              <Badge variant="outline" className="text-xs font-normal">
                                {inc.affectedSystems}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(inc.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-view-incident-${inc.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selectedIncident && (
          <Card className="lg:col-span-3">
            <CardContent className="pt-6 pb-6">
              <IncidentDetail
                key={selectedIncident.id}
                incident={
                  incidentsList.find((i) => i.id === selectedIncident.id) || selectedIncident
                }
                onClose={() => setSelectedIncident(null)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Incident Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Report New Incident
            </DialogTitle>
            <DialogDescription>
              Submit a new security incident. It will start at Step 1 (Detection) of the response workflow.
            </DialogDescription>
          </DialogHeader>
          <NewIncidentForm onClose={() => setNewDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
