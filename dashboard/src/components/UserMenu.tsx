"use client";

import React, { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/app/auth/actions";
import { LogOut, User, ShieldAlert, ChevronDown } from "lucide-react";

interface UserMenuProps {
  email: string;
  roles: string[];
}

export default function UserMenu({ email, roles }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logoutAction();
  };

  const getInitials = (emailStr: string) => {
    if (!emailStr) return "U";
    return emailStr.split("@")[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-secondary transition-all focus:outline-none"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-display font-semibold text-xs tracking-wide">
          {getInitials(email)}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-foreground max-w-[120px] truncate">
            {email.split("@")[0]}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {roles[0] || "member"}
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg shadow-black/10 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-xs font-semibold text-foreground truncate">{email}</p>
          </div>

          <div className="px-4 py-2 border-b border-border bg-accent/5 flex items-center space-x-2 text-[10px] uppercase font-bold tracking-wider text-primary">
            <User className="w-3 h-3" />
            <span>Roles: {roles.join(", ") || "None"}</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-xs text-destructive hover:bg-destructive/10 transition-all flex items-center space-x-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
