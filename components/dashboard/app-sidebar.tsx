"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Layers,
  ScrollText,
  BarChart2,
  Zap,
  Eye,
  Shield,
  Globe,
  KeyRound,
  Link2,
  HardDrive,
  Flag,
  Bot,
  Cpu,
  ChevronRight,
  Search,
  Bell,
  MoreHorizontal,
  ChevronsUpDown,
  CreditCard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard", active: true },
  { label: "Builder", icon: Bot, href: "/builder" },
  { label: "Deployments", icon: Layers, href: "/dashboard/deployments" },
  { label: "Logs", icon: ScrollText, href: "/dashboard/logs" },
  { label: "Analytics", icon: BarChart2, href: "/dashboard/analytics" },
  { label: "Speed Insights", icon: Zap, href: "/dashboard/speed-insights" },
  {
    label: "Observability",
    icon: Eye,
    href: "/dashboard/observability",
    children: [
      { label: "Runtime Logs", href: "/dashboard/observability/runtime" },
      { label: "Build Logs", href: "/dashboard/observability/build" },
      { label: "Metrics", href: "/dashboard/observability/metrics" },
    ],
  },
  {
    label: "Firewall",
    icon: Shield,
    href: "/dashboard/firewall",
    children: [
      { label: "Rules", href: "/dashboard/firewall/rules" },
      { label: "Attack Challenges", href: "/dashboard/firewall/challenges" },
    ],
  },
  {
    label: "CDN",
    icon: Globe,
    href: "/dashboard/cdn",
    children: [
      { label: "Cache", href: "/dashboard/cdn/cache" },
      { label: "Edge Config", href: "/dashboard/cdn/edge-config" },
    ],
  },
  { label: "Environment Variables", icon: KeyRound, href: "/dashboard/env" },
  { label: "Domains", icon: Link2, href: "/dashboard/domains" },
  { label: "Integrations", icon: Cpu, href: "/dashboard/integrations" },
  { label: "Storage", icon: HardDrive, href: "/dashboard/storage" },
  {
    label: "Flags",
    icon: Flag,
    href: "/dashboard/flags",
    children: [
      { label: "Feature Flags", href: "/dashboard/flags/feature" },
      { label: "Experiments", href: "/dashboard/flags/experiments" },
    ],
  },
  {
    label: "Agent",
    icon: Bot,
    href: "/dashboard/agent",
    children: [
      { label: "Sessions", href: "/dashboard/agent/sessions" },
      { label: "Tools", href: "/dashboard/agent/tools" },
    ],
  },
  {
    label: "AI Gateway",
    icon: Zap,
    href: "/dashboard/ai-gateway",
    children: [
      { label: "Routes", href: "/dashboard/ai-gateway/routes" },
      { label: "Usage", href: "/dashboard/ai-gateway/usage" },
    ],
  },
  { label: "Billing & Credits", icon: CreditCard, href: "/dashboard/billing" },
];

function NavItem({ item }: { item: typeof navItems[0] }) {
  const [open, setOpen] = useState(false);

  if (item.children) {
    return (
      <Collapsible open={open} onOpenChange={setOpen} asChild>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className="w-full justify-between"
              isActive={item.active}
            >
              <span className="flex items-center gap-2">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.label}>
                  <SidebarMenuSubButton asChild>
                    <a href={child.href}>{child.label}</a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={item.active}>
        <a href={item.href} className="flex items-center gap-2">
          <item.icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      {/* Header — project selector */}
      <SidebarHeader className="border-b border-foreground/10 px-3 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
                      <span className="text-background text-[10px] font-mono font-medium">M</span>
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs font-medium truncate leading-tight">ragabsadek91-…</span>
                      <span className="text-[10px] text-muted-foreground font-mono truncate leading-tight">Hobby</span>
                    </div>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem className="font-mono text-xs">ragabsadek91-… <span className="ml-auto text-muted-foreground">Hobby</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs">Create team</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Search */}
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            placeholder="Find..."
            className="w-full h-7 pl-8 pr-6 text-xs bg-foreground/[0.03] border border-foreground/10 outline-none placeholder:text-muted-foreground/60 font-sans"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/60">F</kbd>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user */}
      <SidebarFooter className="border-t border-foreground/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarFallback className="bg-orange-500 text-white text-[10px] font-mono">R</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-medium truncate leading-tight">ragabsadek91-9468</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs">Profile</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
