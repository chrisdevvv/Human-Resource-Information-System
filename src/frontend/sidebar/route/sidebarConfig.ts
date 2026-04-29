import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarDays,
  LayoutDashboard,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { hasAccessToFeature } from "@/frontend/auth/roleAccess";

export type SidebarRole = "data-encoder" | "admin" | "super-admin";

export type SidebarTab = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const SIDEBAR_TABS: SidebarTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "employees-list",
    label: "Employees Profile",
    icon: Users,
  },
  {
    id: "employee-management",
    label: "Leave Management",
    icon: CalendarDays,
  },
  {
    id: "user-roles",
    label: "User & Roles",
    icon: ShieldCheck,
  },
  {
    id: "logs",
    label: "Activity Logs",
    icon: Activity,
  },
  {
    id: "configuration",
    label: "Configuration",
    icon: SlidersHorizontal,
  },
];

export function normalizeSidebarRole(role: string): SidebarRole {
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

  if (value === "admin" || value === "admin_user") {
    return "admin";
  }

  return "data-encoder";
}

export function isSuperAdminRole(role: string): boolean {
  return normalizeSidebarRole(role) === "super-admin";
}

export function getSidebarTabsByRole(role: string): SidebarTab[] {
  const normalizedRole = normalizeSidebarRole(role);
  return SIDEBAR_TABS.filter((tab) =>
    hasAccessToFeature(normalizedRole, tab.id),
  );
}
