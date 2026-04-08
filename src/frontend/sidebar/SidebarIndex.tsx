"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CircleUser,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { logoutNow } from "@/frontend/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

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
    id: "employees-list",
    label: "Employees Profile",
    icon: Users,
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
    label: "Activity Logs",
    icon: Activity,
    roles: ["super-admin"],
  },
  {
    id: "configuration",
    label: "Configuration",
    icon: SlidersHorizontal,
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

function toPositiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function getSchoolContextFromStoredUser(userStr: string | null): {
  schoolName: string;
  schoolId: number | null;
} {
  if (!userStr) {
    return { schoolName: "", schoolId: null };
  }

  const parsed = JSON.parse(userStr) as unknown;
  if (!parsed || typeof parsed !== "object") {
    return { schoolName: "", schoolId: null };
  }

  const root = parsed as Record<string, unknown>;
  const nestedCandidates = [root, root.user, root.data, root.profile].filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );

  let fallbackSchoolId: number | null = null;

  for (const candidate of nestedCandidates) {
    const directSchoolName =
      safeValue(candidate.school_name) || safeValue(candidate.schoolName);
    const directSchoolId = toPositiveNumber(
      candidate.school_id ?? candidate.schoolId,
    );

    const schoolObj =
      typeof candidate.school === "object" && candidate.school !== null
        ? (candidate.school as Record<string, unknown>)
        : null;

    const nestedSchoolName = schoolObj
      ? safeValue(schoolObj.school_name) ||
        safeValue(schoolObj.schoolName) ||
        safeValue(schoolObj.name)
      : "";
    const nestedSchoolId = schoolObj
      ? toPositiveNumber(schoolObj.id ?? schoolObj.school_id)
      : null;

    const resolvedSchoolName =
      directSchoolName || nestedSchoolName || safeValue(candidate.school);
    const resolvedSchoolId = directSchoolId ?? nestedSchoolId;

    if (!fallbackSchoolId && resolvedSchoolId) {
      fallbackSchoolId = resolvedSchoolId;
    }

    if (resolvedSchoolName) {
      return {
        schoolName: resolvedSchoolName,
        schoolId: resolvedSchoolId ?? fallbackSchoolId,
      };
    }
  }

  return { schoolName: "", schoolId: fallbackSchoolId };
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
  title = "CHRIS",
  collapsed,
  defaultCollapsed = false,
  onToggleCollapse,
  className = "",
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const [firstName, setFirstName] = useState("");
  const [schoolLabel, setSchoolLabel] = useState("");
  const normalizedRole = useMemo(() => normalizeRole(role), [role]);
  const tabs = useMemo(() => getSidebarTabsByRole(role), [role]);
  const isCollapsed = collapsed ?? internalCollapsed;

  useEffect(() => {
    let isDisposed = false;

    const loadSchoolLabel = async () => {
      try {
        const userStr = localStorage.getItem("user");
        setFirstName(getFirstNameFromStoredUser(userStr));

        if (normalizedRole === "super-admin") {
          setSchoolLabel("Department of Education");
          return;
        }

        const { schoolName, schoolId } =
          getSchoolContextFromStoredUser(userStr);

        if (schoolName) {
          setSchoolLabel(schoolName);
          return;
        }

        setSchoolLabel("Assigned School");
        if (!schoolId) {
          return;
        }

        const token = localStorage.getItem("authToken");
        if (!token) {
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/schools/${schoolId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const body = (await response.json().catch(() => ({}))) as {
          data?: { school_name?: unknown };
        };

        if (!response.ok || isDisposed) {
          return;
        }

        const fetchedSchoolName = safeValue(body.data?.school_name);
        if (fetchedSchoolName) {
          setSchoolLabel(fetchedSchoolName);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setSchoolLabel(
          normalizedRole === "super-admin"
            ? "Department of Education"
            : "Assigned School",
        );
      }
    };

    loadSchoolLabel();

    return () => {
      isDisposed = true;
    };
  }, [normalizedRole]);

  const handleToggle = () => {
    const next = !isCollapsed;
    if (collapsed === undefined) {
      setInternalCollapsed(next);
    }
    if (onToggleCollapse) {
      onToggleCollapse(next);
    }
  };

  const handleLogout = async () => {
    await logoutNow();
    window.location.replace("/login");
  };

  const handleOpenSettings = () => {
    onTabChange("profile-settings");
  };

  return (
    <aside
      className={`hidden md:flex md:sticky md:top-0 h-screen shrink-0 bg-blue-700 text-white border-r border-blue-800 transition-[width] duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } ${className}`}
    >
      <div className="h-full w-full flex flex-col">
        <div
          className={`px-4 border-b border-blue-800 py-4 min-h-36 flex ${isCollapsed ? "flex-col items-center justify-center" : "flex-row items-center justify-between"}`}
        >
          {!isCollapsed && (
            <div className="flex flex-col items-center justify-center flex-1">
              <img
                src="/images/[DEPED] ELMS Logo.svg"
                alt="ELMS Logo"
                className="h-24 w-auto mb-2"
              />
              <p className="text-xs uppercase tracking-widest text-blue-100 text-center">
                Welcome, {firstName}
              </p>
              <h2 className="text-lg font-semibold leading-tight text-center">
                {title}
              </h2>
              <p className="mt-1 max-w-55 text-xs leading-tight text-blue-100 text-center whitespace-normal overflow-hidden max-h-8">
                {schoolLabel}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggle}
            className="cursor-pointer p-2 rounded-md hover:bg-blue-800 transition shrink-0"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>

          {isCollapsed && (
            <img
              src="/images/[DEPED] ELMS Logo.svg"
              alt="ELMS Logo"
              className="h-16 w-auto"
            />
          )}
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
                className={`cursor-pointer w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition ${
                  isActive
                    ? "bg-blue-900 text-white"
                    : "text-blue-50 hover:bg-blue-800"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed ? (
                  <span className="text-xs font-medium">{tab.label}</span>
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
            className={`cursor-pointer ${isCollapsed ? "w-full" : "flex-1"} flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition text-blue-50 hover:bg-red-600`}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && (
              <span className="text-xs font-medium">Logout</span>
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
            <CircleUser size={18} className="shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
}
