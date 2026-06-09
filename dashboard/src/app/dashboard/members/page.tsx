"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Search,
  UserPlus,
  Trash2,
  Mail,
  Shield,
  Loader2,
  AlertCircle,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clipboard,
} from "lucide-react";

interface Member {
  id: string;
  email: string;
  username?: string | null;
  first_name: string;
  last_name: string;
  status: string;
  last_login_at?: string | null;
  created_at: string;
  roles: Array<{ id: string; name: string }>;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

export default function MembersPage() {
  // Members State
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Invite Form States
  const [roles, setRoles] = useState<Role[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete Action States
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Dropdown states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Search Debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Members
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/memberships?page=${page}&limit=${limit}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to fetch members");
      }

      setMembers(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, limit]);

  // Load Roles for Invitation
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/roles");
        if (res.ok) {
          const data = await res.json();
          setRoles(data || []);
        }
      } catch (err) {
        console.error("Failed to load roles:", err);
      }
    };
    if (isInviteOpen) {
      fetchRoles();
    }
  }, [isInviteOpen]);

  // Handle Invitation
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    setInviteToken(null);

    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role_id: inviteRoleId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create invitation");
      }

      setInviteToken(data.invitation_token);
      fetchMembers(); // Reload list
    } catch (err: any) {
      setInviteError(err.message || "Failed to invite member");
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle Deletion
  const handleDeleteSubmit = async () => {
    if (!selectedMember) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/memberships/${selectedMember.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to remove member");
      }

      setIsDeleteOpen(false);
      setSelectedMember(null);
      fetchMembers(); // Reload list
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete membership");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyToClipboard = (token: string) => {
    // Generate full verification URL matching config
    const inviteUrl = `${window.location.origin}/auth/register?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter members on client side by query as fallback/enrichment
  const filteredMembers = members.filter((m) => {
    if (!debouncedSearch) return true;
    const s = debouncedSearch.toLowerCase();
    const name = `${m.first_name} ${m.last_name}`.toLowerCase();
    const email = m.email.toLowerCase();
    return name.includes(s) || email.includes(s);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Members Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invite colleagues, adjust system roles, and revoke account access.
          </p>
        </div>
        <button
          onClick={() => {
            setInviteEmail("");
            setInviteRoleId("");
            setInviteToken(null);
            setInviteError(null);
            setIsInviteOpen(true);
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-lg shadow-sm shadow-primary/20 transition-all focus:outline-none"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Controls (Search and filters) */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member name or email..."
              className="w-full h-9 pl-9 pr-4 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted-foreground">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 px-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Content canvas */}
        <div className="overflow-x-auto">
          {loading ? (
            /* Skeleton Loading rows */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {Array(limit)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-border/50 animate-pulse">
                      <td className="p-4"><div className="h-4 bg-muted rounded w-28" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-36" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-16" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-12" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-24" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-4" /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : error ? (
            /* Error display */
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Failed to load members</p>
              <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
              <button
                onClick={fetchMembers}
                className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-md border border-border"
              >
                Retry Request
              </button>
            </div>
          ) : filteredMembers.length === 0 ? (
            /* No results empty state */
            <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No members found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {debouncedSearch
                    ? "Your search parameters matched no active organization members."
                    : "There are currently no active users in this tenant."}
                </p>
              </div>
              {debouncedSearch && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-md shadow-sm"
                >
                  Clear search parameters
                </button>
              )}
            </div>
          ) : (
            /* Actual Data Table */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-all text-xs"
                  >
                    <td className="p-4 font-semibold text-foreground">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="p-4 text-muted-foreground">{member.email}</td>
                    <td className="p-4">
                      {member.roles.map((r) => (
                        <span
                          key={r.id}
                          className="inline-block bg-accent/60 text-accent-foreground px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wide border border-accent"
                        >
                          {r.name}
                        </span>
                      )) || "None"}
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase">
                        {member.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {member.last_login_at
                        ? new Date(member.last_login_at).toLocaleString()
                        : "Never logged in"}
                    </td>
                    <td className="p-4 relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(activeMenuId === member.id ? null : member.id)
                        }
                        className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground focus:outline-none"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu actions */}
                      {activeMenuId === member.id && (
                        <div className="absolute right-4 mt-1 w-36 bg-card border border-border rounded-lg shadow-lg py-1 z-20 animate-in fade-in duration-100">
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setIsDeleteOpen(true);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center space-x-2 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove User</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {total > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
            <div>
              Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{total}</span> members
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

      {/* Invitation Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-primary" />
              <span>Invite New Member</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Create an invitation link for a new user. Once generated, you can copy the setup URL.
            </p>

            {inviteError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {inviteToken ? (
              /* Success token show */
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs">
                  <p className="font-semibold text-sm mb-1">Invitation link generated!</p>
                  <p className="leading-relaxed">
                    A setup URL has been created. Copy it below to complete user registration.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/auth/register?token=${inviteToken}`}
                    className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-xs font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(inviteToken)}
                    className="px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-md shadow-sm flex items-center space-x-1.5 focus:outline-none"
                  >
                    {copied ? (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="w-full py-2 bg-secondary border border-border hover:bg-secondary/80 rounded-md text-xs font-semibold text-foreground transition-all mt-4"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Invitation Form */
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label htmlFor="invite-email" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full h-9 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="invite-role" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Assign Role
                  </label>
                  <select
                    id="invite-role"
                    required
                    value={inviteRoleId}
                    onChange={(e) => setInviteRoleId(e.target.value)}
                    className="w-full h-9 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="" disabled>Select role type...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail || !inviteRoleId}
                  className="w-full h-9 mt-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-md shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating link...</span>
                    </>
                  ) : (
                    <span>Generate Invitation Link</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Revocation Confirmation Dialog */}
      {isDeleteOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-md font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span>Revoke Membership?</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-normal mb-6">
              Are you sure you want to remove <span className="font-semibold text-foreground">{selectedMember.first_name} {selectedMember.last_name}</span> ({selectedMember.email})? This action soft-deletes the user and immediately revokes all their active sessions. This cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedMember(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 border border-border bg-background hover:bg-secondary rounded-lg font-semibold text-foreground focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={deleteLoading}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 focus:outline-none disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Revoke Membership</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
