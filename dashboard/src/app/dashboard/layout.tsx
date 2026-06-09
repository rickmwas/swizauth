export const dynamic = "force-dynamic";

import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser, getOrganizationDetails } from "@/lib/auth";
import UserMenu from "@/components/UserMenu";
import {
  Shield,
  LayoutDashboard,
  Users,
  Terminal,
  KeyRound,
  FileSpreadsheet,
  Building,
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
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const org = await getOrganizationDetails(user.organizationId);
  const orgName = org?.name || "SwizAuth Tenant";

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar nav panel */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-card shrink-0">
        {/* Brand header */}
        <div className="h-16 px-6 border-b border-border flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <span className="text-lg font-display font-bold tracking-tight text-foreground">
            Swiz<span className="text-primary">Auth</span>
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Active organization context footer */}
        <div className="p-4 border-t border-border bg-accent/5 flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary text-primary border border-border">
            <Building className="w-4.5 h-4.5" />
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-xs font-semibold text-foreground truncate">
              {orgName}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              ID: {user.organizationId.substring(0, 8)}...
            </p>
          </div>
        </div>
      </aside>

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md px-6 flex items-center justify-between z-10">
          {/* Organization context display for mobile / top header */}
          <div className="flex items-center space-x-3">
            <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-center space-x-2 bg-secondary/80 px-3 py-1 rounded-full border border-border text-xs font-semibold">
              <Building className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground max-w-[120px] sm:max-w-[180px] truncate">
                {orgName}
              </span>
            </div>
          </div>

          {/* User profile actions */}
          <div className="flex items-center space-x-4">
            <UserMenu email={user.email} roles={user.roles} />
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background via-background to-accent/5">
          {children}
        </main>
      </div>
    </div>
  );
}
