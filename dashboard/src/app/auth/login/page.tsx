"use client";

import React, { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "../actions";
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const [state, action, isPending] = useActionState(loginAction, {
    success: false,
  });

  const isLocked = state.error?.code === "ACCOUNT_LOCKED";

  useEffect(() => {
    if (state.success) {
      if (state.mfaRequired) {
        router.push("/auth/verify-mfa");
      } else {
        router.push("/dashboard");
      }
    }
  }, [state, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    
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
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your administration workspace.
        </p>
      </div>

      {/* Account Locked Alert */}
      {isLocked && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">This account is locked</p>
            <p className="text-muted-foreground text-xs leading-normal">
              Due to multiple failed login attempts, your account has been temporarily locked for security. Please contact your system administrator or support to restore access.
            </p>
            <a
              href="mailto:support@terrasept.com"
              className="inline-block text-xs font-semibold text-primary hover:underline pt-1"
            >
              Contact Support &rarr;
            </a>
          </div>
        </div>
      )}

      {/* Standard Error Alert */}
      {state.error && !isLocked && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            disabled={isPending}
            placeholder="name@organization.com"
            className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={isPending}
              placeholder="••••••••••••"
              className="w-full h-10 pl-3 pr-10 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-10 mt-2 rounded-lg bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 text-primary-foreground font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        Need to set up a tenant?{" "}
        <Link href="/auth/register" className="font-semibold text-primary hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
