"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SuperAdmin from "../../frontend/super-admin/SuperAdminIndex";
import SidebarIndex from "../../frontend/sidebar/SidebarIndex";
import SidebarMobile from "../../frontend/sidebar/SidebarMobile";
import StickyHeader from "../../frontend/components/StickyHeader";

export default function Page() {
  const router = useRouter();
  const [role, setRole] = useState("super-admin");
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
        if (u?.role !== "SUPER_ADMIN") {
          setIsAuthorized(false);
          router.replace("/login");
          return;
        }

        setRole(u.role);
        setIsAuthorized(true);
      } catch (e) {
        setIsAuthorized(false);
        router.replace("/login");
      }
    };

    verifyAuth();
    // Re-check auth when page is restored from browser back/forward cache.
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
    setActiveTab(tab);
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
          <main className="p-6 bg-white min-h-[calc(100vh-88px)] w-full transition-all duration-300">
            <SuperAdmin activeTab={activeTab} />
          </main>
        </div>
      </div>

      <main className="md:hidden p-4 bg-white min-h-[calc(100vh-72px)] w-full">
        <SuperAdmin activeTab={activeTab} />
      </main>
    </div>
  );
}
