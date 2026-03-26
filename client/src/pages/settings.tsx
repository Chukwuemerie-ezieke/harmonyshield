import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Building2,
  User,
  Bell,
  Info,
  Shield,
  Mail,
  MapPin,
  Hash,
  Landmark,
  GraduationCap,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Globe,
  Heart,
} from "lucide-react";
import type { School, User as UserType } from "@shared/schema";

// ──────────── Types ────────────
interface NotificationPref {
  id: string;
  label: string;
  description: string;
  icon: typeof Mail;
  enabled: boolean;
}

// ──────────── Main Component ────────────
export default function SettingsPage() {
  const { data: schools, isLoading: schoolsLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users/1"],
  });

  // Demo school is ID 1
  const school = schools?.find((s) => s.id === 1);
  // Demo user is admin (first user)
  const user = usersData?.[0];

  // Notification prefs stored in state (non-persistent, styled only)
  const [notifications, setNotifications] = useState<NotificationPref[]>([
    {
      id: "threat_alerts",
      label: "Threat Alerts",
      description: "Get notified when new critical or high-severity threats are detected",
      icon: ShieldCheck,
      enabled: true,
    },
    {
      id: "incident_updates",
      label: "Incident Updates",
      description: "Receive updates on incident status changes and new incident reports",
      icon: AlertTriangle,
      enabled: true,
    },
    {
      id: "compliance_reminders",
      label: "Compliance Reminders",
      description: "Reminders for upcoming compliance deadlines and overdue items",
      icon: FileText,
      enabled: true,
    },
    {
      id: "training_reminders",
      label: "Training Reminders",
      description: "Notifications about assigned training courses and deadlines",
      icon: GraduationCap,
      enabled: false,
    },
    {
      id: "weekly_digest",
      label: "Weekly Digest",
      description: "Weekly summary of compliance status, threats, and incidents",
      icon: Mail,
      enabled: true,
    },
    {
      id: "news_updates",
      label: "Cybersecurity News",
      description: "Updates when relevant cybersecurity news articles are published",
      icon: Globe,
      enabled: false,
    },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const isLoading = schoolsLoading || usersLoading;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
          <Settings className="h-5 w-5 text-muted-foreground" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage school information, preferences, and account settings
        </p>
      </div>

      {/* ── School Information ── */}
      <Card data-testid="card-school-info">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            School Information
          </CardTitle>
          <CardDescription className="text-xs">
            Details about your registered educational institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : school ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Building2} label="School Name" value={school.name} testId="text-school-name" />
              <InfoRow icon={MapPin} label="Address" value={school.address} testId="text-school-address" />
              <InfoRow icon={Landmark} label="State / LGA" value={`${school.state}, ${school.lga}`} testId="text-school-state" />
              <InfoRow
                icon={GraduationCap}
                label="Type"
                value={
                  <Badge variant="secondary" className="text-[11px] capitalize">
                    {school.type}
                  </Badge>
                }
                testId="text-school-type"
              />
              <InfoRow icon={User} label="Student Count" value={school.studentCount.toLocaleString()} testId="text-student-count" />
              <InfoRow
                icon={Hash}
                label="NDPC Reg. Number"
                value={
                  school.ndpcRegNumber ? (
                    <span className="font-mono text-xs">{school.ndpcRegNumber}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Not registered</span>
                  )
                }
                testId="text-ndpc-reg"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">School information not available.</p>
          )}
        </CardContent>
      </Card>

      {/* ── User Profile ── */}
      <Card data-testid="card-user-profile">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            User Profile
          </CardTitle>
          <CardDescription className="text-xs">
            Your account information (demo user)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : user ? (
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon={User} label="Name" value={user.name} testId="text-user-name" />
                <InfoRow icon={Mail} label="Email" value={user.email} testId="text-user-email" />
                <InfoRow
                  icon={Shield}
                  label="Role"
                  value={
                    <Badge
                      className={`text-[11px] border-0 ${
                        user.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : user.role === "dpo"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                      variant="outline"
                    >
                      {user.role === "dpo" ? "DPO" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  }
                  testId="text-user-role"
                />
                <InfoRow icon={Building2} label="Department" value={user.department ?? "—"} testId="text-user-dept" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">User information not available.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Notification Preferences ── */}
      <Card data-testid="card-notifications">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-xs">
            Configure which alerts and updates you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {notifications.map((pref, idx) => {
            const PrefIcon = pref.icon;
            return (
              <div key={pref.id}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <PrefIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{pref.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={pref.enabled}
                    onCheckedChange={() => toggleNotification(pref.id)}
                    data-testid={`switch-notif-${pref.id}`}
                  />
                </div>
                {idx < notifications.length - 1 && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── About ── */}
      <Card data-testid="card-about">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            About HarmonyShield
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold">HarmonyShield</p>
              <p className="text-[11px] text-muted-foreground">
                EdTech Cybersecurity Suite for NDPR Compliance
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Version</p>
              <p className="font-medium text-xs mt-0.5">1.0.0</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Build</p>
              <p className="font-mono text-xs mt-0.5">2026.03.26</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Developer</p>
              <p className="font-medium text-xs mt-0.5">Harmony Digital Consults Ltd</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">License</p>
              <p className="font-medium text-xs mt-0.5">Proprietary</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Links</p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://ndpc.gov.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
                data-testid="link-ndpc"
              >
                <Globe className="h-3 w-3" />
                NDPC Nigeria
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href="https://nitda.gov.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
                data-testid="link-nitda"
              >
                <Globe className="h-3 w-3" />
                NITDA
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href="https://harmonydigitalconsults.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
                data-testid="link-harmony"
              >
                <Globe className="h-3 w-3" />
                Harmony Digital Consults
              </a>
            </div>
          </div>

          <Separator />

          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            Protecting Nigerian Education, One School at a Time
            <Heart className="h-3 w-3 text-red-400 fill-red-400" />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────── Info Row Helper ────────────
function InfoRow({
  icon: Icon,
  label,
  value,
  testId,
}: {
  icon: typeof User;
  label: string;
  value: React.ReactNode;
  testId?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium mt-0.5" data-testid={testId}>
          {value}
        </div>
      </div>
    </div>
  );
}
