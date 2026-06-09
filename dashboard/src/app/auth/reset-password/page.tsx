"use client";

import React, { startTransition, useActionState, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPasswordAction } from "../actions";
import { Shield, Loader2, AlertCircle, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const resetActionBound = resetPasswordAction.bind(null, token);
  const [state, action, isPending] = useActionState(resetActionBound, {
    success: false,
  });

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
    setValidationError("");

    if (isPending) return;

    if (!token) {
      setValidationError("Missing password reset token. Please request a new link.");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      action(formData);
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-md shadow-black/5">
      {/* Brand logo */}
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
          Create new password
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure a secure password containing uppercase, lowercase, numbers, and symbols.
        </p>
      </div>

      {state.success && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Password updated!</p>
            <p className="text-xs leading-normal">
              Your password has been successfully reset. You can now use your new credentials to log into the dashboard.
            </p>
            <Link
              href="/auth/login"
              className="inline-block text-xs font-semibold text-primary hover:underline pt-1"
            >
              Sign In &rarr;
            </Link>
          </div>
        </div>
      )}

      {(state.error || validationError) && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError || state.error?.message}</span>
        </div>
      )}

      {!state.success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              disabled={isPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

          <div>
            <label htmlFor="confirm_password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirm_password"
              type="password"
              required
              disabled={isPending}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-10 mt-3 rounded-lg bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 text-primary-foreground font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-muted-foreground">
        Remember your credentials?{" "}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Go back
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8 bg-card border border-border rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
