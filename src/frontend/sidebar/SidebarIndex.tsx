"use client";

import React, { useMemo, useState } from "react";
import { CircleUser, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { logoutNow } from "@/frontend/auth/session";
import { APP_ROUTES } from "@/frontend/route";
import { getSidebarTabsByRole, type SidebarRole } from "./route/sidebarConfig";
import { useSidebarIdentity } from "./route/useSidebarIdentity";

export { getSidebarTabsByRole };
export type { SidebarRole };

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
  const { firstName, schoolLabel } = useSidebarIdentity(role);

  const tabs = useMemo(() => getSidebarTabsByRole(role), [role]);
  const isCollapsed = collapsed ?? internalCollapsed;

  const handleToggle = () => {
    const next = !isCollapsed;

    if (collapsed === undefined) {
      setInternalCollapsed(next);
    }

    onToggleCollapse?.(next);
  };

  const handleLogout = async () => {
    await logoutNow();
    window.location.replace(APP_ROUTES.LOGIN);
  };

  const handleOpenSettings = () => {
    onTabChange("profile-settings");
  };

  const sidebarWidthClass = isCollapsed ? "w-16" : "w-64";

  return (
    <>
      {/* Spacer para hindi matakpan ng fixed sidebar ang content */}
      <div
        className={`hidden md:block shrink-0 transition-[width] duration-300 ${sidebarWidthClass}`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:flex ${sidebarWidthClass} flex-col border-r border-blue-800 bg-blue-700 text-white transition-[width] duration-300 ${className}`}
      >
        <div className="flex h-full min-h-0 w-full flex-col">
          <div
            className={`border-b border-blue-800 px-4 py-4 ${
              isCollapsed
                ? "flex min-h-36 flex-col items-center justify-center"
                : "flex min-h-36 flex-row items-center justify-between"
            }`}
          >
            {!isCollapsed && (
              <div className="flex flex-1 flex-col items-center justify-center">
                <img
                  src="/images/[DEPED] ELMS Logo.svg"
                  alt="ELMS Logo"
                  className="mb-2 h-24 w-auto"
                />
                <p className="text-center text-xs uppercase tracking-widest text-blue-100">
                  Welcome, {firstName}
                </p>
                <h2 className="text-center text-lg font-semibold leading-tight">
                  {title}
                </h2>
                <p className="mt-1 max-h-8 max-w-55 overflow-hidden whitespace-normal text-center text-xs leading-tight text-blue-100">
                  {schoolLabel}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleToggle}
              className="shrink-0 rounded-md p-2 transition hover:bg-blue-800 cursor-pointer"
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

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  title={isCollapsed ? tab.label : undefined}
                  className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left transition flex items-center gap-3 ${
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
            className={`border-t border-blue-800 p-3 ${
              isCollapsed ? "flex flex-col gap-2" : "flex items-center gap-2"
            }`}
          >
            <button
              type="button"
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-blue-50 transition hover:bg-red-600 cursor-pointer ${
                isCollapsed ? "w-full" : "flex-1"
              }`}
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
              className={`flex items-center justify-center rounded-lg p-2 transition cursor-pointer ${
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
    </>
  );
}
