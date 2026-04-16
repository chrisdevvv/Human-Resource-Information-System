export const APP_ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  ADMIN: "/admin",
  SUPER_ADMIN: "/super-admin",
  DATA_ENCODER: "/data-encoder",
  NEW_USER: "/new-user",
  LEAVE_CARD_ROOT: "/leave-card",
  LEAVE_HISTORY_ROOT: "/leave-history",
  SUPER_ADMIN_LOGS_REPORT: "/super-admin/logsreportgeneration",
} as const;

export const PROTECTED_ROUTE_PREFIXES = [
  APP_ROUTES.ADMIN,
  APP_ROUTES.SUPER_ADMIN,
  APP_ROUTES.DATA_ENCODER,
  APP_ROUTES.LEAVE_CARD_ROOT,
] as const;

export function getLeaveCardRoute(employeeId: number | string): string {
  return `${APP_ROUTES.LEAVE_CARD_ROOT}/${String(employeeId)}`;
}

export function getLeaveHistoryRoute(employeeId: number | string): string {
  return `${APP_ROUTES.LEAVE_HISTORY_ROOT}/${String(employeeId)}`;
}

export function getLogsReportRoute(query?: string): string {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) {
    return APP_ROUTES.SUPER_ADMIN_LOGS_REPORT;
  }

  return `${APP_ROUTES.SUPER_ADMIN_LOGS_REPORT}?${normalizedQuery}`;
}

export function getDashboardRouteByRoleStrict(
  role?: string,
  fallback: string = APP_ROUTES.LOGIN,
): string {
  const normalizedRole = String(role || "")
    .trim()
    .toUpperCase();

  if (normalizedRole === "SUPER_ADMIN") {
    return APP_ROUTES.SUPER_ADMIN;
  }
  if (normalizedRole === "ADMIN") {
    return APP_ROUTES.ADMIN;
  }
  if (normalizedRole === "DATA_ENCODER") {
    return APP_ROUTES.DATA_ENCODER;
  }

  return fallback;
}

export function getDashboardRouteByRoleLoose(
  role?: string,
  fallback: string = APP_ROUTES.ROOT,
): string {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole.includes("super")) {
    return APP_ROUTES.SUPER_ADMIN;
  }
  if (normalizedRole.includes("admin")) {
    return APP_ROUTES.ADMIN;
  }
  if (normalizedRole.includes("data") || normalizedRole.includes("encoder")) {
    return APP_ROUTES.DATA_ENCODER;
  }

  return fallback;
}
