"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataEncoder from "../../frontend/data-encoder/EncoderIndex";
import SidebarIndex from "../../frontend/sidebar/SidebarIndex";
import SidebarMobile from "../../frontend/sidebar/SidebarMobile";
import StickyHeader from "../../frontend/components/StickyHeader";
import AppFooter from "../../frontend/footer/page";
import { hasAccessToFeature } from "../../frontend/auth/roleAccess";

const ACTIVE_TAB_STORAGE_KEY = "activeTab:data-encoder";
const ALLOWED_TABS = new Set(["employee-management", "profile-settings"]);

export default function Page() {
  const router = useRouter();
  const [role, setRole] = useState("data-encoder");
  const [activeTab, setActiveTab] = useState("employee-management");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verifyAuth = () => {
      try {
        const token = localStorage.getItem("authToken");
        const raw = localStorage.getItem("user");

        if (!token || !raw) {
          setIsAuthorized(false);
          router.replace("/login");
          return;
        }

        const u = JSON.parse(raw);
        // Check if user's role is data-encoder (not admin or super-admin)
        const normalizedRole = String(u?.role || "").toLowerCase();
        if (
          !normalizedRole.includes("data") ||
          normalizedRole.includes("admin")
        ) {
          // Not data-encoder, redirect to appropriate dashboard
          if (normalizedRole.includes("super")) {
            router.replace("/super-admin");
          } else if (normalizedRole.includes("admin")) {
            router.replace("/admin");
          } else {
            setIsAuthorized(false);
            router.replace("/login");
          }
          setIsAuthorized(false);
          router.replace("/login");
          return;
        }

        const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
        // Validate that the saved tab is allowed for this role
        const nextTab =
          savedTab &&
          ALLOWED_TABS.has(savedTab) &&
          hasAccessToFeature(u.role, savedTab)
            ? savedTab
            : "employee-management";
        // Verify default tab is accessible
        if (!hasAccessToFeature(u.role, nextTab)) {
          setIsAuthorized(false);
          router.replace("/login");
          return;
        }

        setRole(u.role);
        setActiveTab(nextTab);
        setIsAuthorized(true);
      } catch (e) {
        setIsAuthorized(false);
        router.replace("/login");
      }
    };

    verifyAuth();
    window.addEventListener("pageshow", verifyAuth);
    return () => window.removeEventListener("pageshow", verifyAuth);
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  const handleToggleSidebar = () => {
    setSidebarCollapsed((current) => !current);
  };

  const handleTabChange = (tab: string) => {
    if (!ALLOWED_TABS.has(tab)) {
      return;
    }
    if (!hasAccessToFeature(role, tab)) {
      return;
    }

    setActiveTab(tab);
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="md:hidden">
        <SidebarMobile
          role={role}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          title="HRIS"
        />
      </div>

      <div className="hidden md:flex min-h-screen">
        <SidebarIndex
          role={role}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
        />

        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <StickyHeader onMenuClick={handleToggleSidebar} />
          <main className="p-6 flex-1 w-full transition-all duration-300">
            <DataEncoder activeTab={activeTab} />
          </main>
          <AppFooter />
        </div>
      </div>

      <div className="md:hidden min-h-screen flex flex-col">
        <main className="p-4 flex-1 w-full">
          <DataEncoder activeTab={activeTab} />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
