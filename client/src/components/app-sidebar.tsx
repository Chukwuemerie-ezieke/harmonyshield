import {
  LayoutDashboard,
  ClipboardCheck,
  Shield,
  GraduationCap,
  AlertTriangle,
  FileText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "NDPR Compliance", url: "/compliance", icon: ClipboardCheck },
  { title: "Threat Monitor", url: "/threats", icon: Shield },
  { title: "Staff Training", url: "/training", icon: GraduationCap },
  { title: "Incidents", url: "/incidents", icon: AlertTriangle },
  { title: "Reports & Audit", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useHashLocation();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/20">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground" data-testid="text-brand-name">
              HarmonyShield
            </span>
            <span className="text-[10px] text-sidebar-foreground/50 font-medium">
              by Harmony Digital Consults
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest font-semibold">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location === "/" || location === ""
                    : location.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <p className="text-[10px] text-sidebar-foreground/40 text-center leading-relaxed">
          Protecting Nigerian Education,
          <br />
          One School at a Time 🛡️
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
