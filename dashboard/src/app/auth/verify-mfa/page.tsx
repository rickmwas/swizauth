"use client";

import React, { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyMfaAction } from "../actions";
import { Shield, Loader2, AlertCircle, KeyRound } from "lucide-react";

import Link from "next/link";

export default function VerifyMfaPage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [state, action, isPending] = useActionState(verifyMfaAction, {
    success: false,
  });

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
    }
  }, [state, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Allow only digits

    const newCode = [...code];
    // Take only the last character if multiple are entered
    const digit = value.substring(value.length - 1);
    newCode[index] = digit;
    setCode(newCode);

    if (digit !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (code[index] === "" && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return; // Only paste exactly 6 digits

    const newCode = pastedData.split("");
    setCode(newCode);
    
    // Put focus on the last input
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    const fullCode = code.join("");
    if (fullCode.length !== 6) return;

    const formData = new FormData();
    formData.append("code", fullCode);

    startTransition(() => {
      action(formData);
    });
  };

  // Auto submit when all 6 cells are filled
  useEffect(() => {
    const fullCode = code.join("");
    if (fullCode.length === 6 && !isPending) {
      const form = document.getElementById("mfa-form") as HTMLFormElement | null;
      if (form) {
        form.requestSubmit();
      }
    }
  }, [code, isPending]);

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

      <div className="flex flex-col items-center text-center space-y-2 mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground mb-2">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-display font-semibold tracking-tight text-foreground">
          Enter Security Code
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Please enter the 6-digit confirmation code from your authenticator application.
        </p>
      </div>

      {state.error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error.message}</span>
        </div>
      )}

      <form id="mfa-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={isPending}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center font-display font-semibold text-lg bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isPending || code.join("").length !== 6}
          className="w-full h-10 rounded-lg bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 text-primary-foreground font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Code</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        Go back to{" "}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Login page
        </Link>
      </div>
    </div>
  );
}
