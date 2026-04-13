/**
 * Utility for managing browser tab titles
 * Format: "CHRIS — [Tab Name]"
 */

const TAB_TITLE_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  "employees-list": "Employees Profile",
  eservice: "E-Service Record",
  "employee-management": "Leave Management",
  "user-roles": "User & Roles",
  logs: "Activity Logs",
  configuration: "Configuration",
  "profile-settings": "Profile Settings",
  "monthly-credit-simulation": "Monthly Credit Simulation",
};

export function getTabDisplayName(tabId: string): string {
  return TAB_TITLE_MAP[tabId] || "Dashboard";
}

export function setPageTitle(tabId: string): void {
  const tabName = getTabDisplayName(tabId);
  document.title = `CHRIS — ${tabName}`;
}

export function setDefaultTitle(): void {
  document.title = "CHRIS";
}

export function setLoginTitle(): void {
  document.title = "CSJDM DepEd Human Resource Information System";
}
