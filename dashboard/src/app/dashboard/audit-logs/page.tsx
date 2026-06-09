"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Search,
  Filter,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
} from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string | null;
  ip_address: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Filter states
  const [actionFilter, setActionFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const availableActions = [
    { value: "user.login", label: "User Login" },
    { value: "user.logout", label: "User Logout" },
    { value: "memberships.invite", label: "Membership Invitation" },
    { value: "memberships.accept", label: "Membership Accepted" },
    { value: "memberships.delete", label: "Membership Revoked" },
    { value: "applications.create", label: "Application Registered" },
    { value: "applications.rotate-secret", label: "Client Secret Rotated" },
    { value: "api_keys.create", label: "API Key Generated" },
    { value: "api_keys.revoke", label: "API Key Revoked" },
  ];

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(actionFilter && { action: actionFilter }),
      ...(userIdFilter && { user_id: userIdFilter }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    }).toString();

    try {
      const res = await fetch(`/api/audit?${query}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to fetch audit logs");
      }

      setLogs(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, actionFilter, userIdFilter, startDate, endDate]);

  const clearFilters = () => {
    setActionFilter("");
    setUserIdFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Audit Logs Workspace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review security events, access histories, and tenant configuration modifications.
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm shadow-black/5 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-foreground border-b border-border pb-2.5">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filter Audit History</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label htmlFor="filter-action" className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
              Action Code
            </label>
            <select
              id="filter-action"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 px-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Actions</option>
              {availableActions.map((act) => (
                <option key={act.value} value={act.value}>
                  {act.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-user" className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
              User ID (Optional)
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="filter-user"
                type="text"
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Search user UUID..."
                className="w-full h-8 pl-7 pr-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="filter-start" className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
              Start Date
            </label>
            <input
              id="filter-start"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 px-2 bg-background border border-border rounded-md focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-end" className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
              End Date
            </label>
            <input
              id="filter-end"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 px-2 bg-background border border-border rounded-md focus:outline-none"
            />
          </div>
        </div>

        {(actionFilter || userIdFilter || startDate || endDate) && (
          <div className="flex justify-end pt-2 border-t border-border/50">
            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-md border border-border transition-all"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Logs Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Registered Log Audit Trail</span>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted-foreground">Rows:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 px-2 bg-background border border-border rounded-md focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            /* Skeleton Loading */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Resource</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {Array(limit)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-border/50 animate-pulse">
                      <td className="p-4"><div className="h-4 bg-muted rounded w-28" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-36" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-20" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-16" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-24" /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : error ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Failed to load audit logs</p>
              <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
              <button
                onClick={fetchLogs}
                className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-md border border-border"
              >
                Retry Request
              </button>
            </div>
          ) : logs.length === 0 ? (
            /* Empty state SVG */
            <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No audit logs found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Your search filters did not match any registered security event or action log in this workspace.
                </p>
              </div>
              {(actionFilter || userIdFilter || startDate || endDate) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-md shadow-sm"
                >
                  Reset filter parameters
                </button>
              )}
            </div>
          ) : (
            /* Actual Data Table */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Resource</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-all text-xs"
                  >
                    <td className="p-4 text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono text-foreground font-semibold text-[10px] select-all">
                          {log.user_id}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-semibold">
                      {log.resource}
                    </td>
                    <td className="p-4 text-muted-foreground font-mono">
                      <div className="flex items-center space-x-1">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span>{log.ip_address}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        {total > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
            <div>
              Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{total}</span> logs
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-1 bg-background border border-border rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 font-semibold text-foreground">{page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= total}
                className="p-1 bg-background border border-border rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
