"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Admin from "../../frontend/admin/AdminIndex";
import SidebarIndex from "../../frontend/sidebar/SidebarIndex";
import SidebarMobile from "../../frontend/sidebar/SidebarMobile";
import StickyHeader from "../../frontend/components/StickyHeader";

const ACTIVE_TAB_STORAGE_KEY = "activeTab:admin";
const ALLOWED_TABS = new Set([
  "dashboard",
  "employee-management",
  "user-roles",
  "profile-settings",
]);

export default function Page() {
  const router = useRouter();
  const [role, setRole] = useState("data-encoder");
  const [activeTab, setActiveTab] = useState("dashboard");
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
        if (u?.role !== "ADMIN") {
          setIsAuthorized(false);
          router.replace("/login");
          return;
        }

        const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
        const nextTab =
          savedTab && ALLOWED_TABS.has(savedTab) ? savedTab : "dashboard";

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
          title="ELMS"
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

        <div className="flex-1 min-w-0">
          <StickyHeader onMenuClick={handleToggleSidebar} />
          <main className="p-6 min-h-[calc(100vh-88px)] w-full transition-all duration-300">
            <Admin activeTab={activeTab} onTabChange={handleTabChange} />
          </main>
        </div>
      </div>

      <main className="md:hidden p-4 min-h-[calc(100vh-72px)] w-full">
        <Admin activeTab={activeTab} onTabChange={handleTabChange} />
      </main>
    </div>
  );
}
