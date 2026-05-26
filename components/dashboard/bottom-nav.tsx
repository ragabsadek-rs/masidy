"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Hammer, CreditCard, User } from "lucide-react";

const navItems = [
  { label: "Home",     icon: LayoutDashboard, href: "/dashboard" },
  { label: "Projects", icon: FolderOpen,       href: "/dashboard/projects" },
  { label: "Builder",  icon: Hammer,           href: "/builder" },
  { label: "Billing",  icon: CreditCard,       href: "/dashboard/billing" },
  { label: "Profile",  icon: User,             href: "/dashboard/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-foreground/10 md:hidden">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/builder" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-300",
                isActive ? "text-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-mono leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
