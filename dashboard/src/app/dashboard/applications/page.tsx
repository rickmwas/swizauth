"use client";

import React, { useState, useEffect } from "react";
import {
  Terminal,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  FileCode,
} from "lucide-react";

interface Application {
  id: string;
  name: string;
  description?: string | null;
  client_id: string;
  application_type: string;
  redirect_urls: string[];
  status: string;
  created_at: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isConfirmRotateOpen, setIsConfirmRotateOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Form states
  const [appName, setAppName] = useState("");
  const [appDesc, setAppDesc] = useState("");
  const [appType, setAppType] = useState("web");
  const [redirectUrlsInput, setRedirectUrlsInput] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Credentials show states
  const [createdCredentials, setCreatedCredentials] = useState<{
    client_id: string;
    client_secret: string;
    name: string;
  } | null>(null);

  // Rotation states
  const [rotateLoading, setRotateLoading] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);

  // Copy states
  const [copiedClientId, setCopiedClientId] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Load apps
  const fetchApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to load applications");
      }
      setApps(data || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Handle Application Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    // Split redirect URLs by newline or comma and clean
    const redirect_urls = redirectUrlsInput
      .split(/[\n,]+/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (redirect_urls.length === 0) {
      setCreateError("At least one redirect URL is required");
      setCreateLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appName,
          description: appDesc || undefined,
          application_type: appType,
          redirect_urls,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create application");
      }

      setCreatedCredentials({
        client_id: data.client_id,
        client_secret: data.client_secret,
        name: appName,
      });

      setIsCreateOpen(false);
      setIsCredentialsOpen(true);
      fetchApps(); // Reload list
    } catch (err: any) {
      setCreateError(err.message || "Failed to register application");
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Secret Rotation
  const handleRotateSecret = async () => {
    if (!selectedApp) return;
    setRotateLoading(true);
    setRotateError(null);

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/rotate-secret`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to rotate secret");
      }

      setCreatedCredentials({
        client_id: selectedApp.client_id,
        client_secret: data.client_secret,
        name: selectedApp.name,
      });

      setIsConfirmRotateOpen(false);
      setIsCredentialsOpen(true);
    } catch (err: any) {
      setRotateError(err.message || "Failed to rotate secret");
    } finally {
      setRotateLoading(false);
    }
  };

  const copyText = (text: string, type: "client_id" | "secret") => {
    navigator.clipboard.writeText(text);
    if (type === "client_id") {
      setCopiedClientId(true);
      setTimeout(() => setCopiedClientId(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Applications Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register and manage OAuth client applications to integrate TSAUTH authentication.
          </p>
        </div>
        <button
          onClick={() => {
            setAppName("");
            setAppDesc("");
            setAppType("web");
            setRedirectUrlsInput("");
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-lg shadow-sm shadow-primary/20 transition-all focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>Register Application</span>
        </button>
      </div>

      {/* Grid List or states */}
      {loading ? (
        /* Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 h-48 animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-10 bg-muted rounded w-full mt-4" />
              </div>
            ))}
        </div>
      ) : error ? (
        <div className="card-premium p-12 text-center flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-sm font-semibold text-foreground">Failed to load applications</p>
          <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
          <button
            onClick={fetchApps}
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-md border border-border"
          >
            Retry Request
          </button>
        </div>
      ) : apps.length === 0 ? (
        <div className="card-premium p-16 text-center flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No applications registered</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              There are currently no OAuth client registrations configured in this organization.
            </p>
          </div>
        </div>
      ) : (
        /* Applications List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              className="group card-premium hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-secondary text-primary">
                      <FileCode className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-foreground">{app.name}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mt-0.5">{app.application_type} Client</p>
                    </div>
                  </div>
                  <span className="inline-block bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase">
                    {app.status}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {app.description || "No description provided."}
                </p>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded border border-border">
                    <span className="text-muted-foreground font-mono text-[10px]">Client ID:</span>
                    <span className="font-mono text-foreground select-all text-[11px] font-semibold">{app.client_id}</span>
                  </div>
                  
                  <div className="text-[10px]">
                    <span className="text-muted-foreground font-semibold">Redirect URLs:</span>
                    <ul className="list-disc pl-4 text-muted-foreground font-mono mt-1 space-y-0.5">
                      {app.redirect_urls.map((url, index) => (
                        <li key={index} className="truncate">{url}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-border mt-5 flex justify-between items-center text-xs">
                <span className="text-muted-foreground text-[10px]">Registered: {new Date(app.created_at).toLocaleDateString()}</span>
                
                <button
                  onClick={() => {
                    setSelectedApp(app);
                    setIsConfirmRotateOpen(true);
                  }}
                  className="flex items-center space-x-1.5 text-primary hover:underline font-semibold focus:outline-none"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotate secret</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="card-premium w-full max-w-md p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <Terminal className="w-5 h-5 text-primary" />
              <span>Register Application</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Create an integration client for your application to communicate with TSAUTH.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="app-name" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Application Name
                </label>
                <input
                  id="app-name"
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. SwizMobile App"
                  className="w-full h-9 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="app-desc" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  id="app-desc"
                  value={appDesc}
                  onChange={(e) => setAppDesc(e.target.value)}
                  placeholder="Summarize application context..."
                  className="w-full h-16 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label htmlFor="app-type" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Application Type
                </label>
                <select
                  id="app-type"
                  value={appType}
                  onChange={(e) => setAppType(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none"
                >
                  <option value="web">Web Application (Next.js, React, etc.)</option>
                  <option value="mobile">Native Mobile / Desktop App</option>
                  <option value="service">Backend Service / Daemon</option>
                </select>
              </div>

              <div>
                <label htmlFor="app-redirects" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Allowed Redirect URLs (one per line)
                </label>
                <textarea
                  id="app-redirects"
                  required
                  value={redirectUrlsInput}
                  onChange={(e) => setRedirectUrlsInput(e.target.value)}
                  placeholder="http://localhost:3000/api/auth/callback"
                  className="w-full h-16 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={createLoading || !appName || !redirectUrlsInput}
                className="w-full h-9 mt-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-md shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Register Application</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Show Credentials Modal (Show once) */}
      {isCredentialsOpen && createdCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="card-premium w-full max-w-md p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span>Application Credentials</span>
            </h3>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-lg mb-6 leading-relaxed">
              <strong>WARNING:</strong> Make sure to copy the client secret now. It is hashed in the database and <strong>cannot be retrieved again</strong> once this dialog is closed.
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-secondary rounded-lg border border-border space-y-3">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Application Name</span>
                  <p className="text-foreground font-semibold mt-0.5">{createdCredentials.name}</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Client ID</span>
                    <button
                      onClick={() => copyText(createdCredentials.client_id, "client_id")}
                      className="text-primary hover:underline flex items-center space-x-1.5 focus:outline-none"
                    >
                      {copiedClientId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedClientId ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="font-mono text-foreground select-all p-1.5 bg-background rounded border border-border text-[11px] truncate">
                    {createdCredentials.client_id}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Client Secret</span>
                    <button
                      onClick={() => copyText(createdCredentials.client_secret, "secret")}
                      className="text-primary hover:underline flex items-center space-x-1.5 focus:outline-none"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSecret ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="font-mono text-foreground select-all p-1.5 bg-background rounded border border-border text-[11px] break-all leading-normal">
                    {createdCredentials.client_secret}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCredentialsOpen(false);
                  setCreatedCredentials(null);
                }}
                className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-md shadow-sm transition-all focus:outline-none mt-4 text-xs"
              >
                I have securely saved these credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Rotation secret Dialog */}
      {isConfirmRotateOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="card-premium w-full max-w-sm p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-md font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span>Rotate Client Secret?</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-normal mb-6">
              Are you sure you want to rotate the client secret for <span className="font-semibold text-foreground">{selectedApp.name}</span>? Any existing services using the current client secret will immediately fail to authenticate.
            </p>

            {rotateError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rotateError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setIsConfirmRotateOpen(false);
                  setSelectedApp(null);
                }}
                disabled={rotateLoading}
                className="px-4 py-2 border border-border bg-background hover:bg-secondary rounded-lg font-semibold text-foreground focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleRotateSecret}
                disabled={rotateLoading}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 focus:outline-none disabled:opacity-50"
              >
                {rotateLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rotating...</span>
                  </>
                ) : (
                  <span>Rotate Secret</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
