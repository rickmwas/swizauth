"use client";

import React, { useEffect, useState } from "react";
import { 
  CreditCard, 
  Check, 
  Zap, 
  Building, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ExternalLink
} from "lucide-react";

interface PlanLimits {
  apps: number;
  members: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: { apps: 1, members: 5 },
  STARTER: { apps: 5, members: 50 },
  PROFESSIONAL: { apps: 9999, members: 9999 },
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Organization and subscription details
  const [org, setOrg] = useState<{
    id: string;
    name: string;
    plan: string;
    subscription_id: string | null;
    plan_expires_at: string | null;
  } | null>(null);

  // Usage counts
  const [appCount, setAppCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    async function loadBillingData() {
      try {
        setErrorMsg(null);
        // Let's resolve the user from our local proxy API
        const [appsRes, membersRes] = await Promise.all([
          fetch("/api/applications"),
          fetch("/api/memberships"),
        ]);

        if (appsRes.ok) {
          const apps = await appsRes.json();
          setAppCount(Array.isArray(apps) ? apps.length : 0);
        }

        if (membersRes.ok) {
          const members = await membersRes.json();
          setMemberCount(members.data && Array.isArray(members.data) ? members.data.length : 0);
        }

        // Decode the JWT token from client-side cookies
        const cookiesMap = document.cookie.split(";").reduce((acc, c) => {
          const [k, v] = c.trim().split("=");
          acc[k] = v;
          return acc;
        }, {} as Record<string, string>);

        const token = cookiesMap["access_token"];
        if (token) {
          try {
            const payloadBase64 = token.split(".")[1];
            const decoded = JSON.parse(window.atob(payloadBase64));
            setOrg({
              id: decoded.org,
              name: decoded.org_name || "Active Tenant",
              plan: (decoded.plan || "FREE").toUpperCase(),
              subscription_id: decoded.subscription_id || null,
              plan_expires_at: decoded.plan_expires_at || null,
            });
          } catch (e) {
            console.error("Failed to parse jwt token", e);
          }
        }
      } catch (err) {
        console.error("Failed to load billing metrics", err);
        setErrorMsg("Failed to load billing metrics. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    loadBillingData();
  }, []);

  const handleUpgrade = async (planName: string, priceId: string) => {
    setActionLoading(planName);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to initiate Stripe checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg("Failed to redirect to Stripe checkout.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while initializing checkout session.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManagePortal = async () => {
    setActionLoading("portal");
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to open Stripe portal");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg("Failed to redirect to Stripe customer portal.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while loading billing portal.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading billing configuration...</p>
      </div>
    );
  }

  const currentPlan = org?.plan || "FREE";
  const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.FREE;

  const appPercent = Math.min((appCount / limits.apps) * 100, 100);
  const memberPercent = Math.min((memberCount / limits.members) * 100, 100);

  // Configuration of Price IDs (Ensure these match your Stripe Price IDs in production)
  const STRIPE_PRICE_STARTER = "price_1StarterIDMockValue";
  const STRIPE_PRICE_PROFESSIONAL = "price_1ProfessionalIDMockValue";

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Billing & Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organization plans, subscription limits, and invoicing details.
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-3 rounded-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-primary/10 border border-primary/20 text-primary text-xs px-4 py-3 rounded-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Current Plan Overview & Usage Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Status Card */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6 shadow-md shadow-black/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase tracking-wider mb-2">
              <Building className="w-3.5 h-3.5" />
              <span>Current Organization</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{org?.name}</h2>
            
            <div className="mt-6 inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-primary text-sm font-semibold">
              <Zap className="w-4 h-4 fill-primary/20" />
              <span>Plan: {currentPlan}</span>
            </div>

            {org?.plan_expires_at && (
              <p className="text-xs text-muted-foreground mt-4 flex items-center space-x-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-muted-foreground/75" />
                <span>Expires on {new Date(org.plan_expires_at).toLocaleDateString()}</span>
              </p>
            )}
          </div>

          {org?.subscription_id && (
            <button
              onClick={handleManagePortal}
              disabled={actionLoading !== null}
              className="mt-8 flex items-center justify-center space-x-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
            >
              {actionLoading === "portal" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              <span>Manage Stripe Billing</span>
            </button>
          )}
        </div>

        {/* Plan Limits & Meters Card */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-md shadow-black/5 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-1">Plan Usage Limits</h3>
            <p className="text-xs text-muted-foreground">Monitor resource usage relative to your plan allowances.</p>
          </div>

          <div className="space-y-5">
            {/* Applications Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">Client Applications</span>
                <span className="text-muted-foreground">
                  {appCount} / {limits.apps === 9999 ? "∞" : limits.apps}
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${appPercent >= 90 ? "bg-destructive" : "bg-primary"}`} 
                  style={{ width: `${appPercent}%` }} 
                />
              </div>
            </div>

            {/* Users / Members Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">Organization Members</span>
                <span className="text-muted-foreground">
                  {memberCount} / {limits.members === 9999 ? "∞" : limits.members}
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${memberPercent >= 90 ? "bg-destructive" : "bg-primary"}`} 
                  style={{ width: `${memberPercent}%` }} 
                />
              </div>
            </div>
          </div>

          {currentPlan === "FREE" && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start space-x-3 text-xs text-destructive animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Upgrade Required</p>
                <p className="mt-0.5 text-destructive/80">
                  You are approaching limit caps. Upgrade to Starter or Professional to unlock unlimited organization growth.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-1">Available Subscription Plans</h3>
          <p className="text-xs text-muted-foreground">Choose the plan that fits your developer and user base growth.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE Plan Card */}
          <div className={`relative bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all ${
            currentPlan === "FREE" ? "border-primary ring-1 ring-primary/20 shadow-md" : "border-border hover:border-primary/50"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-foreground">Free Developer</h4>
                {currentPlan === "FREE" && (
                  <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-3xl font-display font-extrabold text-foreground">$0</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Perfect for sandbox testing and small developer experiments.</p>
              
              <ul className="space-y-3 mb-8">
                <PricingFeature label="1 Client Application" />
                <PricingFeature label="5 Organization Members" />
                <PricingFeature label="Basic Authentication flows" />
                <PricingFeature label="Self-Service MFA (TOTP)" />
              </ul>
            </div>

            <button 
              disabled 
              className="w-full py-2 border border-border rounded-lg text-xs font-semibold text-muted-foreground bg-secondary/50 cursor-not-allowed"
            >
              {currentPlan === "FREE" ? "Current Plan" : "Downgrade (Contact Support)"}
            </button>
          </div>

          {/* STARTER Plan Card */}
          <div className={`relative bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all ${
            currentPlan === "STARTER" ? "border-primary ring-1 ring-primary/20 shadow-md" : "border-border hover:border-primary/50"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-foreground">Starter Team</h4>
                {currentPlan === "STARTER" && (
                  <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-3xl font-display font-extrabold text-foreground">$99</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Ideal for growing developer teams and startup operations.</p>
              
              <ul className="space-y-3 mb-8">
                <PricingFeature label="5 Client Applications" />
                <PricingFeature label="50 Organization Members" />
                <PricingFeature label="API Key Credentials management" />
                <PricingFeature label="Standard RBAC permission roles" />
                <PricingFeature label="Standard Email Support" />
              </ul>
            </div>

            {currentPlan === "STARTER" ? (
              <button disabled className="w-full py-2 border border-border rounded-lg text-xs font-semibold text-muted-foreground bg-secondary/50 cursor-not-allowed">
                Current Plan
              </button>
            ) : (
              <button 
                onClick={() => handleUpgrade("STARTER", STRIPE_PRICE_STARTER)}
                disabled={actionLoading !== null || currentPlan === "PROFESSIONAL"} 
                className="w-full py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {actionLoading === "STARTER" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Upgrade to Starter</span>
                )}
              </button>
            )}
          </div>

          {/* PROFESSIONAL Plan Card */}
          <div className={`relative bg-gradient-to-br from-card via-card to-accent/5 border rounded-xl p-6 shadow-md flex flex-col justify-between transition-all ${
            currentPlan === "PROFESSIONAL" ? "border-primary ring-1 ring-primary/20 shadow-md" : "border-primary/30 hover:border-primary/80"
          }`}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-violet-600 border border-primary/20 px-3 py-1 rounded-full shadow-sm">
              <span className="text-[9px] font-bold text-primary-foreground tracking-wider uppercase">Most Popular</span>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <h4 className="text-lg font-bold text-foreground">Professional SaaS</h4>
                {currentPlan === "PROFESSIONAL" && (
                  <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-3xl font-display font-extrabold text-foreground">$499</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Designed for enterprise-scale IAM infrastructure and high volume usage.</p>
              
              <ul className="space-y-3 mb-8">
                <PricingFeature label="Unlimited Client Applications" />
                <PricingFeature label="Unlimited Organization Members" />
                <PricingFeature label="Audit Logging activity logs" />
                <PricingFeature label="Custom brand configuration" />
                <PricingFeature label="Priority Developer Support" />
                <PricingFeature label="M2M Token scopes credentials" />
              </ul>
            </div>

            {currentPlan === "PROFESSIONAL" ? (
              <button disabled className="w-full py-2 border border-border rounded-lg text-xs font-semibold text-muted-foreground bg-secondary/50 cursor-not-allowed">
                Current Plan
              </button>
            ) : (
              <button 
                onClick={() => handleUpgrade("PROFESSIONAL", STRIPE_PRICE_PROFESSIONAL)}
                disabled={actionLoading !== null}
                className="w-full py-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/95 hover:to-violet-650 text-primary-foreground rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center space-x-1"
              >
                {actionLoading === "PROFESSIONAL" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Go Professional</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingFeature({ label }: { label: string }) {
  return (
    <li className="flex items-start space-x-2.5 text-xs text-muted-foreground">
      <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5 fill-primary/5" />
      <span>{label}</span>
    </li>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
