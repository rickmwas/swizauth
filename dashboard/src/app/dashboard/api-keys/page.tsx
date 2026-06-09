"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
  Loader2,
  AlertCircle,
  X,
  Calendar,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  expires_at?: string | null;
  revoked: boolean;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDisplayKeyOpen, setIsDisplayKeyOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);

  // Form states
  const [keyName, setKeyName] = useState("");
  const [keyExpires, setKeyExpires] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["users.read"]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Output generated key states
  const [generatedKey, setGeneratedKey] = useState<{
    name: string;
    key: string;
  } | null>(null);

  // Revocation states
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Copy states
  const [copiedKey, setCopiedKey] = useState(false);

  // Available scopes in system
  const availableScopes = [
    { value: "users.read", label: "Read Users", desc: "View tenant member lists and logs" },
    { value: "users.create", label: "Create Users", desc: "Invite and onboard new tenant users" },
    { value: "users.delete", label: "Delete Users", desc: "Remove members from the organization" },
    { value: "applications.read", label: "Read Applications", desc: "View OAuth client configurations" },
    { value: "applications.create", label: "Create Applications", desc: "Register new integration applications" },
  ];

  // Fetch Keys
  const fetchKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/api-keys");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to fetch API keys");
      }
      setKeys(data || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleScopeToggle = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  // Handle Key Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    if (selectedScopes.length === 0) {
      setCreateError("At least one scope must be selected");
      setCreateLoading(false);
      return;
    }

    try {
      const payload = {
        name: keyName,
        scopes: selectedScopes,
        expires_at: keyExpires ? new Date(keyExpires).toISOString() : undefined,
      };

      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to generate key");
      }

      setGeneratedKey({
        name: keyName,
        key: data.key,
      });

      setIsCreateOpen(false);
      setIsDisplayKeyOpen(true);
      fetchKeys(); // Reload list
    } catch (err: any) {
      setCreateError(err.message || "Failed to create key");
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Key Revocation
  const handleRevokeSubmit = async () => {
    if (!selectedKey) return;
    setRevokeLoading(true);
    setRevokeError(null);

    try {
      const res = await fetch(`/api/api-keys/${selectedKey.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to revoke key");
      }

      setIsRevokeOpen(false);
      setSelectedKey(null);
      fetchKeys(); // Reload list
    } catch (err: any) {
      setRevokeError(err.message || "Failed to revoke API key");
    } finally {
      setRevokeLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            API Keys Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and manage access tokens for secure machine-to-machine communications.
          </p>
        </div>
        <button
          onClick={() => {
            setKeyName("");
            setKeyExpires("");
            setSelectedScopes(["users.read"]);
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-lg shadow-sm shadow-primary/20 transition-all focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>Generate API Key</span>
        </button>
      </div>

      {/* Keys Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            /* Skeleton Loader */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="p-4">Key Name</th>
                  <th className="p-4">Assigned Scopes</th>
                  <th className="p-4">Expiration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-border/50 animate-pulse">
                      <td className="p-4"><div className="h-4 bg-muted rounded w-24" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-32" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-20" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-12" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-24" /></td>
                      <td className="p-4"><div className="h-4 bg-muted rounded w-4" /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : error ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Failed to load API keys</p>
              <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
              <button
                onClick={fetchKeys}
                className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-md border border-border"
              >
                Retry Request
              </button>
            </div>
          ) : keys.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No API keys generated</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  There are currently no machine-to-machine authorization keys registered for this tenant.
                </p>
              </div>
            </div>
          ) : (
            /* Actual Data Table */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="p-4">Key Name</th>
                  <th className="p-4">Assigned Scopes</th>
                  <th className="p-4">Expiration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr
                    key={k.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-all text-xs"
                  >
                    <td className="p-4 font-semibold text-foreground">{k.name}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-accent/60 text-accent-foreground px-2 py-0.5 rounded-md font-mono text-[9px] border border-accent"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {k.expires_at ? (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(k.expires_at).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        "Never expires"
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[9px] uppercase ${
                          k.revoked
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                        }`}
                      >
                        {k.revoked ? "Revoked" : "Active"}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(k.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {!k.revoked && (
                        <button
                          onClick={() => {
                            setSelectedKey(k);
                            setIsRevokeOpen(true);
                          }}
                          className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md focus:outline-none transition-all"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <span>Generate API Key</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Create a scoped access key for API integrations. Configure expiration and scopes below.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="key-name" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Key Identifier Name
                </label>
                <input
                  id="key-name"
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Server Logs Sync"
                  className="w-full h-9 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="key-expires" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Expiration Date (Optional)
                </label>
                <input
                  id="key-expires"
                  type="date"
                  value={keyExpires}
                  onChange={(e) => setKeyExpires(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Select Authorization Scopes
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-secondary/50 rounded border border-border">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope.value}
                      className="flex items-start space-x-2.5 p-1 rounded hover:bg-secondary cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope.value)}
                        onChange={() => handleScopeToggle(scope.value)}
                        className="mt-1 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{scope.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{scope.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={createLoading || !keyName || selectedScopes.length === 0}
                className="w-full h-9 mt-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-md shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Generate Key</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Show Key Modal (Show once) */}
      {isDisplayKeyOpen && generatedKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-emerald-500" />
              <span>API Key Generated</span>
            </h3>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-lg mb-6 leading-relaxed">
              <strong>WARNING:</strong> Copy this API key now. It is hashed in the database and <strong>cannot be viewed again</strong> once this dialog is closed.
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-secondary rounded-lg border border-border space-y-2">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Key Label</span>
                  <p className="text-foreground font-semibold mt-0.5">{generatedKey.name}</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-semibold">Plaintext Token Key</span>
                    <button
                      onClick={() => copyToClipboard(generatedKey.key)}
                      className="text-primary hover:underline flex items-center space-x-1.5 focus:outline-none font-semibold"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                    </button>
                  </div>
                  <p className="font-mono text-foreground select-all p-2 bg-background rounded border border-border text-[11px] break-all leading-normal">
                    {generatedKey.key}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsDisplayKeyOpen(false);
                  setGeneratedKey(null);
                }}
                className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-md shadow-sm transition-all focus:outline-none mt-4 text-xs"
              >
                I have securely saved this API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Revocation Dialog */}
      {isRevokeOpen && selectedKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-md font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              <span>Revoke API Key?</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-normal mb-6">
              Are you sure you want to revoke <span className="font-semibold text-foreground">{selectedKey.name}</span>? Any external integration or client daemon using this API key will immediately lose access and receive 401 errors. This cannot be undone.
            </p>

            {revokeError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{revokeError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setIsRevokeOpen(false);
                  setSelectedKey(null);
                }}
                disabled={revokeLoading}
                className="px-4 py-2 border border-border bg-background hover:bg-secondary rounded-lg font-semibold text-foreground focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeSubmit}
                disabled={revokeLoading}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 focus:outline-none disabled:opacity-50"
              >
                {revokeLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Revoking...</span>
                  </>
                ) : (
                  <span>Revoke API Key</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
