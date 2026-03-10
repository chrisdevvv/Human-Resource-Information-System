"use client";
import React, { useEffect, useState } from "react";
import Admin from "../../frontend/admin/AdminIndex";
import SidebarIndex from "../../frontend/sidebar/SidebarIndex";

export default function Page() {
  const [role, setRole] = useState("data-encoder");
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
        onToggleCollapse={(c) => setCollapsed(c)}
      />
      <main className={`${collapsed ? "ml-20" : "ml-72"} p-6`}> 
        <Admin />
      </main>
    </>
  );
}
