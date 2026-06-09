"use client";

import React, { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "../actions";
import { Shield, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  
  const [state, action, isPending] = useActionState(registerAction, {
    success: false,
  });

  // Basic client-side password strength validation
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
      {/* Brand logo (visible on mobile where left panel is hidden) */}
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
          Create tenant account
        </h2>
        <p className="text-sm text-muted-foreground">
          Provision a new identity workspace and register your administrator profile.
        </p>
      </div>

      {state.success && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Registration successful!</p>
            <p className="text-xs leading-normal">
              Your tenant admin profile has been created. A verification link has been printed to the system logs. You can now proceed to log in.
            </p>
            <Link
              href="/auth/login"
              className="inline-block text-xs font-semibold text-primary hover:underline pt-1"
            >
              Go to Login &rarr;
            </Link>
          </div>
        </div>
      )}

      {state.error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error.message}</span>
        </div>
      )}

      {!state.success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="organization_id" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Organization ID (UUIDv7)
            </label>
            <input
              id="organization_id"
              name="organization_id"
              type="text"
              required
              autoFocus
              disabled={isPending}
              placeholder="e.g. 018f4c2e-4b2a-71b3-b452-47c3d18e9507"
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                disabled={isPending}
                placeholder="John"
                className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                disabled={isPending}
                placeholder="Doe"
                className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending}
              placeholder="admin@yourdomain.com"
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Password
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
                <span>Registering...</span>
              </>
            ) : (
              <span>Register Tenant</span>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-muted-foreground">
        Already have a tenant?{" "}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
