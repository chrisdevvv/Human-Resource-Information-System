"use client";

import React, { useMemo, useState } from "react";
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
import { useRouter } from "next/navigation";

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
    roles: ALL_ROLES,
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
    roles: ["super-admin"],
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const tabs = useMemo(() => getSidebarTabsByRole(role), [role]);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.clear();
    router.replace("/login");
    router.refresh();
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
        <h1 className="text-lg font-semibold">{title}</h1>
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
        style={{ paddingTop: "64px", maxHeight: "100vh" }}
      >
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
