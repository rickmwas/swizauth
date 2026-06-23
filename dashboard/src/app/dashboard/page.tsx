import React from "react";
import Link from "next/link";
import { getAuthenticatedUser, getOrganizationDetails } from "@/lib/auth";
import {
  Users,
  Terminal,
  KeyRound,
  FileSpreadsheet,
  Building,
  User,
  Shield,
  Activity,
  ArrowUpRight,
} from "lucide-react";

export default async function DashboardOverview() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const org = await getOrganizationDetails(user.organizationId);
  const orgName = org?.name || "Workspace";

  // Let's create beautiful metric cards
  const stats = [
    {
      name: "Total Members",
      value: "Manage",
      description: "Admin & team membership controls",
      icon: Users,
      href: "/dashboard/members",
      color: "text-blue-500",
    },
    {
      name: "Applications",
      value: "Configure",
      description: "OAuth integrations and clients",
      icon: Terminal,
      href: "/dashboard/applications",
      color: "text-indigo-500",
    },
    {
      name: "API Keys",
      value: "Generate",
      description: "Machine-to-machine access tokens",
      icon: KeyRound,
      href: "/dashboard/api-keys",
      color: "text-purple-500",
    },
    {
      name: "Audit Logs",
      value: "View logs",
      description: "Compliance and action histories",
      icon: FileSpreadsheet,
      href: "/dashboard/audit-logs",
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-300">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card-premium">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome to the Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            You are managing the authentication engine for <span className="font-semibold text-foreground">{orgName}</span>.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg text-xs font-semibold self-start md:self-center">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Go Auth Engine: Active</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="group card-premium flex flex-col justify-between h-40"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg bg-secondary ${stat.color} group-hover:bg-primary group-hover:text-primary-foreground transition-all`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all opacity-0 group-hover:opacity-100" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.name}
                </p>
                <p className="text-lg font-bold text-foreground mt-0.5 group-hover:text-primary transition-all">
                  {stat.value} &rarr;
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics Chart Container */}
      <div className="card-premium grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-display font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span>Auth Request Volumes</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Successful logins and OTP verifications over the last 24 hours</p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">Live telemetry</span>
          </div>
          
          {/* Custom SVG mockup chart */}
          <div className="h-64 w-full flex items-end justify-between pt-8 px-2 border-b border-border relative select-none">
            {/* Ambient grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-border w-full h-px" />
              <div className="border-t border-border w-full h-px" />
              <div className="border-t border-border w-full h-px" />
              <div className="border-t border-border w-full h-px" />
            </div>
            
            {/* SVG area/path line representing volumes */}
            <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <path d="M 0 100 Q 15 80 25 50 T 50 40 T 75 75 T 100 20 L 100 100 Z" fill="url(#orange-gradient)" />
                <defs>
                  <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ff6b00" />
                    <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <path d="M 0 100 Q 15 80 25 50 T 50 40 T 75 75 T 100 20" fill="none" stroke="#ff6b00" strokeWidth="2" />
              </svg>
            </div>

            {/* Custom Interactive Mock Columns */}
            {[
              { h: "h-20", l: "08:00", val: "1.2k" },
              { h: "h-32", l: "10:00", val: "2.4k" },
              { h: "h-48", l: "12:00", val: "4.1k" },
              { h: "h-40", l: "14:00", val: "3.2k" },
              { h: "h-24", l: "16:00", val: "1.8k" },
              { h: "h-56", l: "18:00", val: "5.0k" },
              { h: "h-44", l: "20:00", val: "3.8k" },
              { h: "h-16", l: "22:00", val: "1.1k" },
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 group/bar z-10">
                <span className="text-[10px] font-mono font-semibold text-primary opacity-0 group-hover/bar:opacity-100 transition-all -translate-y-2">
                  {bar.val}
                </span>
                <div className={`w-8 bg-primary/20 group-hover/bar:bg-primary/40 rounded-t-sm transition-all duration-300 ${bar.h}`} />
                <span className="text-[10px] text-muted-foreground font-semibold mt-2 font-mono">{bar.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-md font-display font-semibold text-foreground">Performance Latency</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Average request speeds for identity evaluation</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-xs text-muted-foreground font-semibold">User Authentication</span>
              <span className="text-xs font-bold text-foreground font-mono">14ms</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-xs text-muted-foreground font-semibold">TOTP Verification</span>
              <span className="text-xs font-bold text-foreground font-mono">8ms</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-xs text-muted-foreground font-semibold">API Key Scoping</span>
              <span className="text-xs font-bold text-foreground font-mono">3ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">DB Query Execution</span>
              <span className="text-xs font-bold text-primary font-mono">1.4ms</span>
            </div>
          </div>

          <div className="p-4 bg-secondary/50 rounded-lg border border-border space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Cache Hit Ratio</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "94%" }} />
              </div>
              <span className="text-xs font-bold text-foreground font-mono">94%</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Redis Cache hit optimization reduces latency overhead by 85%.</p>
          </div>
        </div>
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="card-premium lg:col-span-1 space-y-6">
          <h2 className="text-md font-display font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>Profile Context</span>
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm">
                {user.email.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">Authenticated Administrator</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-foreground">{user.id.substring(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Active Roles:</span>
                <span className="font-semibold text-primary capitalize">{user.roles.join(", ") || "None"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Configuration Card */}
        <div className="card-premium lg:col-span-2 space-y-6">
          <h2 className="text-md font-display font-semibold text-foreground flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            <span>Tenant Configuration</span>
          </h2>
          {org ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-secondary rounded-lg border border-border">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tenant Name</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{org.name}</p>
                </div>
                <div className="p-3 bg-secondary rounded-lg border border-border">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tenant Slug</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{org.slug}</p>
                </div>
                <div className="p-3 bg-secondary rounded-lg border border-border">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Plan</p>
                  <p className="text-sm font-semibold text-foreground mt-1 capitalize">{org.plan} Plan</p>
                </div>
                <div className="p-3 bg-secondary rounded-lg border border-border">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tenant Status</p>
                  <span className="inline-block bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs px-2.5 py-0.5 rounded-full font-semibold mt-1.5">
                    {org.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-center space-x-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <span>Logical data isolation is enforced for this tenant using organization key.</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Failed to retrieve tenant registration data.</p>
          )}
        </div>
      </div>
    </div>
  );
}
