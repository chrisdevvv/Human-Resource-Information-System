"use client";

import React, { useMemo, useState } from "react";
import SidebarIndex, {
  getSidebarTabsByRole,
  type SidebarRole,
} from "@/frontend/sidebar/SidebarIndex";

const ROLE_OPTIONS: Array<{ label: string; value: SidebarRole }> = [
  { label: "Data Encoder", value: "data-encoder" },
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "super-admin" },
];

export default function SidebarPreviewPage() {
  const [role, setRole] = useState<SidebarRole>("data-encoder");
  const tabs = useMemo(() => getSidebarTabsByRole(role), [role]);
  const [activeTab, setActiveTab] = useState<string>(
    tabs[0]?.id ?? "dashboard",
  );

  const handleRoleChange = (nextRole: SidebarRole) => {
    setRole(nextRole);
    const nextTabs = getSidebarTabsByRole(nextRole);
    setActiveTab(nextTabs[0]?.id ?? "dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <SidebarIndex
          role={role}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="ELMS Preview"
        />

        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
            <h1 className="text-2xl font-bold text-slate-800">
              Sidebar Preview
            </h1>
            <p className="mt-2 text-slate-600">
              This page lets you preview the role-based sidebar without signing
              in.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <label
                htmlFor="roleSelect"
                className="text-sm font-medium text-slate-700"
              >
                Preview role
              </label>
              <select
                id="roleSelect"
                value={role}
                onChange={(e) =>
                  handleRoleChange(e.target.value as SidebarRole)
                }
                className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-800"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-8">
              <p className="text-sm text-slate-500">Active tab</p>
              <h2 className="text-xl font-semibold text-slate-800 mt-1">
                {activeTab}
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-sm text-slate-500 mb-2">
                Visible tabs for this role
              </p>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <span
                    key={tab.id}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-sm"
                  >
                    {tab.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
