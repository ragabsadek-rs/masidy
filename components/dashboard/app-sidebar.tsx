"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Layers, ScrollText, BarChart2, Zap, Eye,
  Shield, Globe, KeyRound, Link2, HardDrive, Flag, Bot, Cpu,
  ChevronRight, Search, Bell, MoreHorizontal, ChevronsUpDown,
  CreditCard, LogOut, Settings, User,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

const navItems = [
  { label: "Overview",              icon: LayoutDashboard, href: "/dashboard" },
  { label: "Builder",               icon: Bot,             href: "/builder" },
  { label: "Deployments",           icon: Layers,          href: "/dashboard/deployments" },
  { label: "Logs",                  icon: ScrollText,      href: "/dashboard/logs" },
  { label: "Analytics",             icon: BarChart2,       href: "/dashboard/analytics" },
  { label: "Speed Insights",        icon: Zap,             href: "/dashboard/speed-insights" },
  { label: "Observability",         icon: Eye,             href: "/dashboard/observability" },
  { label: "Firewall",              icon: Shield,          href: "/dashboard/firewall" },
  { label: "CDN",                   icon: Globe,           href: "/dashboard/cdn" },
  { label: "Environment Variables", icon: KeyRound,        href: "/dashboard/env" },
  { label: "Domains",               icon: Link2,           href: "/dashboard/domains" },
  { label: "Integrations",          icon: Cpu,             href: "/dashboard/integrations" },
  { label: "Storage",               icon: HardDrive,       href: "/dashboard/storage" },
  { label: "Flags",                 icon: Flag,            href: "/dashboard/flags" },
  { label: "AI Agents",             icon: Bot,             href: "/dashboard/agent" },
  { label: "AI Gateway",            icon: Zap,             href: "/dashboard/ai-gateway" },
  { label: "Billing & Credits",     icon: CreditCard,      href: "/dashboard/billing" },
];

function NavItem({ item, currentPath }: { item: typeof navItems[0]; currentPath: string }) {
  const isActive = currentPath === item.href || (item.href !== "/dashboard" && currentPath.startsWith(item.href));
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={item.href} className="flex items-center gap-2">
          <item.icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const [user, setUser] = useState<{ email: string; name: string; initial: string } | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [currentPath, setCurrentPath] = useState("/dashboard");

  useEffect(() => {
    setCurrentPath(window.location.pathname);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const email = data.user.email ?? "";
        const name = data.user.user_metadata?.full_name ?? email.split("@")[0] ?? "User";
        const initial = name.charAt(0).toUpperCase();
        setUser({ email, name, initial });
      }
    });

    fetch("/api/credits/balance")
      .then(r => r.json())
      .then(d => setCredits(d.balance ?? null))
      .catch(() => {});
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-foreground/10 px-3 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
                  <span className="text-background text-[10px] font-mono font-medium">M</span>
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-medium truncate leading-tight">masidy.</span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate leading-tight">
                    {credits !== null ? `${credits} credits` : "Dashboard"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Search */}
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input placeholder="Find…"
            className="w-full h-7 pl-8 pr-6 text-xs bg-foreground/[0.03] border border-foreground/10 outline-none placeholder:text-muted-foreground/60 font-sans" />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/60">F</kbd>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavItem key={item.label} item={item} currentPath={currentPath} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — real user */}
      <SidebarFooter className="border-t border-foreground/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarFallback className="bg-foreground text-background text-[10px] font-mono">
                      {user?.initial ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-medium truncate leading-tight">{user?.name ?? "Loading…"}</span>
                    <span className="text-[10px] text-muted-foreground truncate leading-tight">{user?.email ?? ""}</span>
                  </div>
                  <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {user && (
                  <div className="px-3 py-2 border-b border-foreground/10">
                    <p className="text-xs font-medium truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}
                <DropdownMenuItem className="text-xs" asChild>
                  <Link href="/dashboard"><User className="w-3.5 h-3.5 mr-2" />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" asChild>
                  <Link href="/dashboard/billing"><CreditCard className="w-3.5 h-3.5 mr-2" />
                    Billing {credits !== null && <span className="ml-auto font-mono text-muted-foreground">{credits} cr</span>}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive cursor-pointer" onClick={handleSignOut}>
                  <LogOut className="w-3.5 h-3.5 mr-2" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
