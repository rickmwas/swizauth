"use client";

import React, { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onboardAction } from "../actions";
import { Shield, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function OnboardPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  
  const [state, action, isPending] = useActionState(onboardAction, {
    success: false,
  });

  // Client password strength utility
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return null;
    const requirements = [
      pwd.length >= 8,
      /[A-Z]/.test(pwd),
      /[a-z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ];
    const score = requirements.filter(Boolean).length;
    
    if (score <= 2) return { text: "Weak", color: "bg-red-500", textClass: "text-red-500" };
    if (score <= 4) return { text: "Medium", color: "bg-yellow-500", textClass: "text-yellow-500" };
    return { text: "Strong", color: "bg-green-500", textClass: "text-green-500" };
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
    }
  }, [state.success, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    if (password.length < 8) return;

    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      action(formData);
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-md shadow-black/5">
      {/* Brand logo (visible on mobile) */}
      <div className="flex lg:hidden items-center justify-center space-x-3 mb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <Shield className="w-4.5 h-4.5" />
        </div>
        <span className="text-lg font-display font-bold tracking-tight text-foreground">
          Swiz<span className="text-primary">Auth</span>
        </span>
      </div>

      <div className="space-y-2 mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-display font-semibold tracking-tight text-foreground">
          Create new organization
        </h2>
        <p className="text-sm text-muted-foreground">
          Set up a new isolated identity tenant and administrative account.
        </p>
      </div>

      {state.error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="organization_name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Organization Name
          </label>
          <input
            id="organization_name"
            name="organization_name"
            type="text"
            required
            autoFocus
            disabled={isPending}
            placeholder="e.g. Acme Corp"
            className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Organization Slug (Optional)
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            disabled={isPending}
            placeholder="e.g. acme-corp"
            className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Admin Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={isPending}
            placeholder="admin@acme.com"
            className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Admin Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            disabled={isPending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {strength && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex gap-1 w-1/2">
                <div className={`h-1 flex-1 rounded-full ${strength.color}`} />
                <div className={`h-1 flex-1 rounded-full ${password.length >= 8 && /[A-Z]/.test(password) ? strength.color : "bg-border"}`} />
                <div className={`h-1 flex-1 rounded-full ${password.length >= 8 && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? strength.color : "bg-border"}`} />
              </div>
              <span className={`font-semibold ${strength.textClass}`}>
                {strength.text}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-10 mt-3 rounded-lg bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 text-primary-foreground font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <span>Onboard Tenant</span>
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center space-y-2 text-xs text-muted-foreground">
        <div>
          Already have an organization ID?{" "}
          <Link href="/auth/register" className="font-semibold text-primary hover:underline">
            Register user &rarr;
          </Link>
        </div>
        <div>
          <Link href="/auth/login" className="font-semibold text-muted-foreground hover:text-foreground hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
