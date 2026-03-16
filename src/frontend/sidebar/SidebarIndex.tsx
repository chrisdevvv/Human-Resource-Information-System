"use client";

import React, { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
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

type SidebarProps = {
  role: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  title?: string;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  className?: string;
};

export default function SidebarIndex({
  role,
  activeTab,
  onTabChange,
  title = "ELMS",
  collapsed,
  defaultCollapsed = false,
  onToggleCollapse,
  className = "",
}: SidebarProps) {
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const tabs = useMemo(() => getSidebarTabsByRole(role), [role]);
  const isCollapsed = collapsed ?? internalCollapsed;

  const handleToggle = () => {
    const next = !isCollapsed;
    if (collapsed === undefined) {
      setInternalCollapsed(next);
    }
    if (onToggleCollapse) {
      onToggleCollapse(next);
    }
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
  };

  return (
    <aside
      className={`hidden md:flex md:sticky md:top-0 h-screen shrink-0 bg-blue-700 text-white border-r border-blue-800 transition-[width] duration-300 ${
        isCollapsed ? "w-16" : "w-72"
      } ${className}`}
    >
      <div className="h-full w-full flex flex-col">
        <div className="h-20 px-4 border-b border-blue-800 flex items-center justify-between gap-2">
          {!isCollapsed && (
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-100">
                Role
              </p>
              <h2 className="text-lg font-semibold leading-tight">{title}</h2>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggle}
            className="cursor-pointer p-2 rounded-md hover:bg-blue-800 transition"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                title={isCollapsed ? tab.label : undefined}
                className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                  isActive
                    ? "bg-blue-900 text-white"
                    : "text-blue-50 hover:bg-blue-800"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed ? (
                  <span className="text-sm font-medium">{tab.label}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div
          className={`p-3 border-t border-blue-800 ${isCollapsed ? "flex flex-col gap-2" : "flex items-center gap-2"}`}
        >
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={`cursor-pointer ${isCollapsed ? "w-full" : "flex-1"} flex items-center gap-3 px-3 py-2 rounded-lg text-left transition text-blue-50 hover:bg-red-600`}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
          <button
            type="button"
            onClick={handleOpenSettings}
            title="Settings"
            className={`cursor-pointer p-2 rounded-lg transition flex items-center justify-center ${
              activeTab === "profile-settings"
                ? "bg-blue-900 text-white"
                : "text-blue-50 hover:bg-blue-800"
            }`}
          >
            <SettingsIcon size={18} className="shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
}
