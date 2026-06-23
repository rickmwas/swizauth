"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Terminal,
  KeyRound,
  FileSpreadsheet,
  CreditCard,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Applications", href: "/dashboard/applications", icon: Terminal },
  { name: "API Keys", href: "/dashboard/api-keys", icon: KeyRound },
  { name: "Audit Logs", href: "/dashboard/audit-logs", icon: FileSpreadsheet },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all relative group border ${
              isActive 
                ? "text-primary bg-secondary/60 border-primary/10 shadow-xs" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary border-transparent"
            }`}
          >
            {/* Active page indicator line */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-primary" />
            )}
            <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : ""}`} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
