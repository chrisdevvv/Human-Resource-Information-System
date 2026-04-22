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
      <header className="sticky top-0 left-0 right-0 z-50 w-full border-b border-blue-700 bg-blue-600 px-4 py-3 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md p-2 transition hover:bg-blue-700"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-2">
            <img
              src="/images/DepEd-CHRIS.svg"
              alt="DepEd CHRIS"
              className="h-8 w-auto"
            />
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>

          <div className="w-10" />
        </div>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ease-out ${
          isOpen
            ? "bg-black/45 opacity-100 backdrop-blur-[1.5px]"
            : "pointer-events-none bg-black/0 opacity-0 backdrop-blur-0"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown Menu - comes from top */}
      <nav
        className={`fixed left-0 right-0 top-0 z-50 overflow-y-auto border-b border-blue-700 bg-blue-600 text-white transition-all duration-300 ease-out ${
          isOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-full opacity-0"
        }`}
        style={{ paddingTop: "12px", maxHeight: "100vh" }}
      >
        {/* Logo and Title Header */}
        <div className="flex flex-col items-center justify-center border-b border-blue-700 p-2">
          <img
            src="/images/DepEd-CHRIS.svg"
            alt="DepEd CHRIS"
            className="mb-1 h-10 w-auto"
          />
          <p className="text-center text-xs uppercase tracking-widest text-blue-100">
            Welcome, {firstName}
          </p>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 max-h-8 max-w-55 overflow-hidden whitespace-normal text-center text-xs leading-tight text-blue-100">
            {schoolLabel}
          </p>
        </div>

        <div className="space-y-1 p-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
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
        <div className="space-y-2 border-t border-blue-700 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-blue-50 transition hover:bg-red-600"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="text-xs font-medium">Logout</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSettings}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
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