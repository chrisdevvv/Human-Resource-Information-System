"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SuperAdmin from "../../frontend/super-admin/SuperAdminIndex";
import SidebarIndex from "../../frontend/sidebar/SidebarIndex";
import StickyHeader from "../../frontend/components/StickyHeader";

export default function Page() {
  const router = useRouter();
  const [role, setRole] = useState("super-admin");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <>
      <StickyHeader onMenuClick={handleToggleSidebar} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      {sidebarOpen && (
        <div className="fixed left-0 top-0 z-40 h-screen animate-in slide-in-from-left-full duration-300">
          <SidebarIndex
            role={role}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            defaultCollapsed={false}
            onToggleCollapse={(c) => {
              if (c) setSidebarOpen(false);
            }}
          />
        </div>
      )}
      <main className="p-6 bg-white min-h-screen w-full">
        <SuperAdmin activeTab={activeTab} />
      </main>
    </>
  );
}
