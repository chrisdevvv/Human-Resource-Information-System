"use client";

import React, { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  SettingsIcon,
  User,
  Users,
} from "lucide-react";

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
    id: "leave-request",
    label: "Leave Request",
    icon: CalendarDays,
    roles: ["data-encoder"],
  },
  {
    id: "leave-history",
    label: "Leave History",
    icon: FileText,
    roles: ["data-encoder"],
  },
  {
    id: "leave-encoding",
    label: "Leave Encoding",
    icon: ClipboardList,
    roles: ["data-encoder"],
  },
  {
    id: "employee-management",
    label: "Employee Management",
    icon: Users,
    roles: ["admin", "super-admin"],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["admin", "super-admin"],
  },
  {
    id: "user-roles",
    label: "User & Roles",
    icon: ShieldCheck,
    roles: ["super-admin"],
  },
  {
    id: "system-settings",
    label: "System Settings",
    icon: Settings,
    roles: ["super-admin"],
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    roles: ALL_ROLES,
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
  return SIDEBAR_TABS.filter(
    (tab) => tab.roles.includes(normalizedRole) && tab.id !== "profile",
  );
}

export function getProfileTab(role: string): SidebarTab | undefined {
  const normalizedRole = normalizeRole(role);
  return SIDEBAR_TABS.find(
    (tab) => tab.id === "profile" && tab.roles.includes(normalizedRole),
  );
}

type SidebarProps = {
  role: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  title?: string;
  defaultCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  className?: string;
};

export default function SidebarIndex({
  role,
  activeTab,
  onTabChange,
  title = "ELMS",
  defaultCollapsed = false,
  onToggleCollapse,
  className = "",
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const tabs = useMemo(() => getSidebarTabsByRole(role), [role]);
  const profileTab = useMemo(() => getProfileTab(role), [role]);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (onToggleCollapse) {
      onToggleCollapse(next);
    }
  };

  return (
    <>
      {!collapsed && <div className="fixed inset-0 bg-black/40 z-30" />}
      <aside
        className={`fixed left-0 top-0 h-screen bg-blue-600 text-white border-r border-blue-700 transition-all duration-300 z-40 ${
          collapsed ? "w-20" : "w-72"
        } ${className}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-blue-700 flex items-center justify-between gap-2">
            {!collapsed ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-blue-100">
                  Role
                </p>
                <h2 className="text-lg font-semibold leading-tight">{title}</h2>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <Menu size={20} className="text-blue-100" />
              </div>
            )}

            <button
              type="button"
              onClick={handleToggle}
              className="cursor-pointer p-2 rounded-md hover:bg-blue-700 transition"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
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
                  title={collapsed ? tab.label : undefined}
                  className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                    isActive
                      ? "bg-blue-800 text-white"
                      : "text-blue-50 hover:bg-blue-700"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed ? (
                    <span className="text-sm font-medium">{tab.label}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {profileTab && (
            <div
              className={`p-2 border-t border-blue-700 ${collapsed ? "flex flex-col items-center justify-center gap-1" : "flex items-center gap-1"}`}
            >
              <button
                type="button"
                onClick={() => onTabChange(profileTab.id)}
                title={collapsed ? profileTab.label : undefined}
                className={`cursor-pointer ${collapsed ? "flex items-center justify-center p-2" : "flex-1 flex items-center gap-3 px-3 py-2"} rounded-lg text-left transition ${
                  activeTab === profileTab.id
                    ? "bg-blue-800 text-white"
                    : "text-blue-50 hover:bg-blue-700"
                }`}
              >
                <User size={18} className="shrink-0" />
                {!collapsed ? (
                  <span className="text-sm font-medium">
                    {profileTab.label}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                title="Settings"
                className={`cursor-pointer p-2 rounded-lg transition text-blue-50 hover:bg-blue-700 flex items-center justify-center`}
              >
                <SettingsIcon size={18} className="shrink-0" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
