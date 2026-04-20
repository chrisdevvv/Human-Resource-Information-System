"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState } from "react";
import { CircleUser, LogOut, Menu, X } from "lucide-react";
import { logoutNow } from "@/frontend/auth/session";
import { APP_ROUTES } from "@/frontend/route";
import { getSidebarTabsByRole } from "./route/sidebarConfig";
import { useSidebarIdentity } from "./route/useSidebarIdentity";

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
  title = "CHRIS",
  className = "",
}: SidebarMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { firstName, schoolLabel } = useSidebarIdentity(role);
  const tabs = useMemo(() => getSidebarTabsByRole(role), [role]);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logoutNow();
    window.location.replace(APP_ROUTES.LOGIN);
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
        className={`fixed inset-0 z-30 transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 bg-black/45 backdrop-blur-[1.5px]"
            : "opacity-0 bg-black/0 backdrop-blur-0 pointer-events-none"
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
          <p className="mt-1 max-w-55 text-xs leading-tight text-blue-100 text-center whitespace-normal overflow-hidden max-h-8">
            {schoolLabel}
          </p>
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
                <span className="text-xs font-medium">{tab.label}</span>
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
            <span className="text-xs font-medium">Logout</span>
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
            <CircleUser size={20} className="shrink-0" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
