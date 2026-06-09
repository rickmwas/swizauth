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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-xl shadow-sm">
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
              className="group bg-card border border-border rounded-xl p-6 shadow-sm shadow-black/5 hover:border-primary/50 transition-all flex flex-col justify-between h-40"
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

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm shadow-black/5 lg:col-span-1 space-y-6">
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
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm shadow-black/5 lg:col-span-2 space-y-6">
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
