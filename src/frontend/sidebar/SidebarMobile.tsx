"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  SettingsIcon,
  ShieldCheck,
  Users,
} from "lucide-react";
import { logoutNow } from "@/frontend/auth/session";

export type SidebarRole = "data-encoder" | "admin" | "super-admin";

type SidebarTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: SidebarRole[];
};

const ALL_ROLES: SidebarRole[] = ["data-encoder", "admin", "super-admin"];

const SIDEBAR_TABS: SidebarTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "super-admin"],
  },
  {
    id: "employee-management",
    label: "Leave Management",
    icon: Users,
    roles: ALL_ROLES,
  },
  {
    id: "user-roles",
    label: "User & Roles",
    icon: ShieldCheck,
    roles: ["admin", "super-admin"],
  },
  {
    id: "logs",
    label: "Logs",
    icon: Activity,
    roles: ["super-admin"],
  },
];

function normalizeRole(role: string): SidebarRole {
  const value = role.trim().toLowerCase();
  if (
    value === "data_encoder" ||
    value === "data-encoder" ||
    value === "data encoder"
  ) {
    return "data-encoder";
  }
  if (
    value === "super_admin" ||
    value === "super-admin" ||
    value === "super admin"
  ) {
    return "super-admin";
  }
  if (value === "admin") {
    return "admin";
  }
  return "data-encoder";
}

export function getSidebarTabsByRole(role: string): SidebarTab[] {
  const normalizedRole = normalizeRole(role);
  return SIDEBAR_TABS.filter((tab) => tab.roles.includes(normalizedRole));
}

function safeValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getFirstNameFromStoredUser(userStr: string | null): string {
  if (!userStr) {
    return "";
  }

  const parsed = JSON.parse(userStr) as unknown;
  if (!parsed || typeof parsed !== "object") {
    return "";
  }

  const root = parsed as Record<string, unknown>;
  const nestedCandidates = [root, root.user, root.data, root.profile].filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );

  for (const candidate of nestedCandidates) {
    const fullName =
      safeValue(candidate.fullName) ||
      safeValue(candidate.full_name) ||
      safeValue(candidate.name);
    const firstName =
      safeValue(candidate.firstName) || safeValue(candidate.first_name);
    const lastName =
      safeValue(candidate.lastName) || safeValue(candidate.last_name);
    const email = safeValue(candidate.email);

    const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const nameSource = fullName || combinedName || firstName;

    if (nameSource) {
      return nameSource.split(/\s+/)[0];
    }

    if (email.includes("@")) {
      const emailName = email
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .trim();
      if (emailName) {
        return emailName.split(/\s+/)[0];
      }
    }
  }

  return "";
}

type SidebarMobileProps = {
  role: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  title?: string;
  className?: string;
};

export default function SidebarMobile({
  role,
  activeTab,
  onTabChange,
  title = "ELMS",
  className = "",
}: SidebarMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const tabs = useMemo(() => getSidebarTabsByRole(role), [role]);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      setFirstName(getFirstNameFromStoredUser(userStr));
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logoutNow();
    window.location.replace("/login");
  };

  const handleOpenSettings = () => {
    onTabChange("profile-settings");
    setIsOpen(false);
  };

  return (
    <div className={`md:hidden ${className}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-blue-600 text-white border-b border-blue-700 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-blue-700 transition"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex items-center gap-2">
          <img
            src="/images/[DEPED] ELMS Logo.svg"
            alt="ELMS Logo"
            className="h-8 w-auto"
          />
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="w-10" />
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown Menu - comes from top */}
      <nav
        className={`fixed top-0 left-0 right-0 bg-blue-600 text-white border-b border-blue-700 z-40 transition-all duration-300 ease-out overflow-y-auto ${
          isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-full"
        }`}
        style={{ paddingTop: "12px", maxHeight: "100vh" }}
      >
        {/* Logo and Title Header */}
        <div className="border-b border-blue-700 p-2 flex flex-col items-center justify-center">
          <img
            src="/images/[DEPED] ELMS Logo.svg"
            alt="ELMS Logo"
            className="h-10 w-auto mb-1"
          />
          <p className="text-xs uppercase tracking-widest text-blue-100 text-center">
            Welcome, {firstName}
          </p>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        <div className="p-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                  isActive
                    ? "bg-blue-800 text-white"
                    : "text-blue-50 hover:bg-blue-700"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Logout and Settings */}
        <div className="border-t border-blue-700 p-3 space-y-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition text-blue-50 hover:bg-red-600"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
          <button
            type="button"
            onClick={handleOpenSettings}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
              activeTab === "profile-settings"
                ? "bg-blue-800 text-white"
                : "text-blue-50 hover:bg-blue-700"
            }`}
          >
            <SettingsIcon size={20} className="shrink-0" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
