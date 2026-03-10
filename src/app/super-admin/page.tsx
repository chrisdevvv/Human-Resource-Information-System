"use client";
import React, { useEffect, useState } from "react";
import SuperAdmin from "../../frontend/super-admin/SuperAdminIndex";
import SidebarIndex from "../../frontend/sidebar/SidebarIndex";

export default function Page() {
  const [role, setRole] = useState("super-admin");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.role) setRole(u.role);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <>
      <SidebarIndex
        role={role}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        defaultCollapsed={true}
        onToggleCollapse={(c) => setCollapsed(c)}
      />
      <main className="p-6 bg-white min-h-screen">
        <SuperAdmin activeTab={activeTab} />
      </main>
    </>
  );
}
