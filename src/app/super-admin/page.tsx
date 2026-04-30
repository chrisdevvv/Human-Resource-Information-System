"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SuperAdmin from "../../frontend/super-admin/SuperAdminIndex";
import SidebarIndex from "../../frontend/sidebar/SidebarIndex";
import SidebarMobile from "../../frontend/sidebar/SidebarMobile";
import StickyHeader from "../../frontend/components/StickyHeader";
import AppFooter from "../../frontend/footer/page";
import { ShellSkeleton } from "../../frontend/components/Skeleton/ShellSkeleton";
import { hasAccessToFeature } from "../../frontend/auth/roleAccess";
import { setPageTitle } from "../../frontend/utils/pageTitle";
import { APP_ROUTES } from "@/frontend/route";

const ACTIVE_TAB_STORAGE_KEY = "activeTab:super-admin";
const ALLOWED_TABS = new Set([
  "dashboard",
  "employee-management",
  "employees-list",
  "eservice-record",
  "user-roles",
  "logs",
  "configuration",
  "monthly-credit-simulation",
  "profile-settings",
]);

export default function Page() {
  const router = useRouter();
  const [role, setRole] = useState("super-admin");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyAuth = () => {
      try {
        const token = localStorage.getItem("authToken");
        const raw = localStorage.getItem("user");

        if (!token || !raw) {
          setIsAuthorized(false);
          router.replace(APP_ROUTES.LOGIN);
          return;
        }

        const u = JSON.parse(raw);
        // Check if user's role is super-admin
        const normalizedRole = String(u?.role || "").toLowerCase();
        if (!normalizedRole.includes("super")) {
          // Not super-admin, redirect to appropriate dashboard
          if (
            normalizedRole.includes("admin") &&
            !normalizedRole.includes("super")
          ) {
            router.replace(APP_ROUTES.ADMIN);
          } else if (normalizedRole.includes("data")) {
            router.replace(APP_ROUTES.DATA_ENCODER);
          } else {
            setIsAuthorized(false);
            router.replace(APP_ROUTES.LOGIN);
          }
          setIsAuthorized(false);
          router.replace(APP_ROUTES.LOGIN);
          return;
        }

        const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
        // Validate that the saved tab is allowed for this role
        const nextTab =
          savedTab &&
          ALLOWED_TABS.has(savedTab) &&
          hasAccessToFeature(u.role, savedTab)
            ? savedTab
            : "dashboard";
        // Verify default tab is accessible
        if (!hasAccessToFeature(u.role, nextTab)) {
          setIsAuthorized(false);
          router.replace(APP_ROUTES.LOGIN);
          return;
        }

        setRole(u.role);
        setActiveTab(nextTab);
        setIsAuthorized(true);
      } catch {
        setIsAuthorized(false);
        router.replace(APP_ROUTES.LOGIN);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
    // Re-check auth when page is restored from browser back/forward cache.
    window.addEventListener("pageshow", verifyAuth);
    return () => window.removeEventListener("pageshow", verifyAuth);
  }, [router]);

  useEffect(() => {
    setPageTitle(activeTab);
  }, [activeTab]);

  if (isCheckingAuth) {
    return <ShellSkeleton />;
  }

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
          title="CHRIS"
        />
      </div>

      <div className="hidden md:flex min-h-screen items-stretch">
        <SidebarIndex
          role={role}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
        />

        <div className="flex min-w-0 flex-1 flex-col min-h-screen">
          <StickyHeader
            onMenuClick={handleToggleSidebar}
            isSidebarCollapsed={sidebarCollapsed}
          />
          <main
            className={`bg-white flex-1 min-w-0 w-full transition-all duration-300 ${
              activeTab === "employees-list" || activeTab === "eservice-record" ? "p-3 sm:p-4" : "p-6"
            }`}
          >
            <SuperAdmin activeTab={activeTab} onTabChange={handleTabChange} />
          </main>
          <AppFooter />
        </div>
      </div>

      <div className="md:hidden min-h-screen flex flex-col">
        <main
          className={`bg-white flex-1 w-full ${
            activeTab === "employees-list" || activeTab === "eservice-record" ? "p-3" : "p-4"
          }`}
        >
          <SuperAdmin activeTab={activeTab} onTabChange={handleTabChange} />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
