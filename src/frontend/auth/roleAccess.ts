// Frontend role-based access control utilities
// Maps roles to accessible features

export type UserRole = "data-encoder" | "admin" | "super-admin";
export interface AccessibleFeature {
  id: string;
  label: string;
  roles: UserRole[];
}

export const ACCESSIBLE_FEATURES: AccessibleFeature[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    roles: ["admin", "super-admin"],
  },
  {
    id: "employee-management",
    label: "Leave Management",
    roles: ["data-encoder", "admin", "super-admin"],
  },
  {
    id: "employees-list",
    label: "Employees Profile",
    roles: ["admin", "super-admin"],
  },
  {
    id: "eservice-record",
    label: "E-Service Record",
    roles: ["super-admin"],
  },
  {
    id: "user-roles",
    label: "User & Roles",
    roles: ["admin", "super-admin"],
  },
  {
    id: "logs",
    label: "Activity Logs",
    roles: ["super-admin"],
  },
  {
    id: "configuration",
    label: "Configuration",
    roles: ["super-admin"],
  },
  {
    id: "monthly-credit-simulation",
    label: "Monthly Credit",
    roles: ["super-admin"],
  },
  {
    id: "profile-settings",
    label: "Profile Settings",
    roles: ["data-encoder", "admin", "super-admin"],
  },
];

/**
 * Normalize role string to standard format
 */
function normalizeRole(role: string): UserRole {
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

/**
 * Check if user has access to a specific feature
 */
export function hasAccessToFeature(
  userRole: string | undefined,
  featureId: string,
): boolean {
  if (!userRole) return false;

  const normalizedRole = normalizeRole(userRole);
  const feature = ACCESSIBLE_FEATURES.find((f) => f.id === featureId);

  if (!feature) return false;

  return feature.roles.includes(normalizedRole);
}

/**
 * Get all accessible features for a user role
 */
export function getAccessibleFeatures(
  userRole: string | undefined,
): AccessibleFeature[] {
  if (!userRole) return [];

  const normalizedRole = normalizeRole(userRole);
  return ACCESSIBLE_FEATURES.filter((f) => f.roles.includes(normalizedRole));
}

/**
 * Check if a user can access a specific page/tab
 */
export function canAccessPage(
  userRole: string | undefined,
  pageId: string,
): boolean {
  if (!userRole) return false;

  switch (pageId) {
    case "dashboard":
    case "admin-dashboard":
      return (
        normalizeRole(userRole) === "admin" ||
        normalizeRole(userRole) === "super-admin"
      );
    case "user-roles":
    case "admin-user-roles":
      return (
        normalizeRole(userRole) === "admin" ||
        normalizeRole(userRole) === "super-admin"
      );
    case "eservice-record":
      return normalizeRole(userRole) === "super-admin";
    case "logs":
    case "admin-logs":
      return normalizeRole(userRole) === "super-admin";
    case "configuration":
    case "super-admin-configuration":
      return normalizeRole(userRole) === "super-admin";
    case "monthly-credit-simulation":
      return normalizeRole(userRole) === "super-admin";
    case "leave-management":
    case "employee-management":
      return ["data-encoder", "admin", "super-admin"].includes(
        normalizeRole(userRole),
      );
    case "employees-list":
      return ["admin", "super-admin"].includes(normalizeRole(userRole));
    case "profile-settings":
      return ["data-encoder", "admin", "super-admin"].includes(
        normalizeRole(userRole),
      );
    default:
      return false;
  }
}
