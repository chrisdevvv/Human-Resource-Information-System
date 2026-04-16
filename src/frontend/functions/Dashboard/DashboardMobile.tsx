"use client";

import React from "react";
import {
  Users,
  FileText,
  UserCheck,
  UserMinus,
  Archive,
  Building2,
  LayoutDashboard,
} from "lucide-react";
import { type BacklogRecord, useDashboardData } from "./useDashboardData";

type StatCard = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  textColor: string;
  tab?: string;
  intent?: {
    key: string;
    value: string;
  };
};

const EMPLOYEES_LIST_TAB_KEY = "employeesList:activeTab";
const USER_ROLES_TAB_KEY = "userRoles:activeTab";

type DashboardMobileProps = {
  onTabChange?: (tab: string) => void;
  showRecentLogs?: boolean;
};

export default function DashboardMobile({
  onTabChange,
  showRecentLogs = true,
}: DashboardMobileProps) {
  const {
    stats,
    isSuperAdmin,
    loading,
    error,
    recentLogs,
    canAccessDashboard,
  } = useDashboardData({ showRecentLogs });

  if (!canAccessDashboard) {
    return null;
  }

  const statCards: StatCard[] = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: <Users className="w-4 h-4" />,
      textColor: "text-blue-700",
      tab: "employees-list",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <UserCheck className="w-4 h-4" />,
      textColor: "text-green-700",
      tab: "user-roles",
    },
    ...(isSuperAdmin
      ? [
          {
            title: "Total Schools",
            value: stats.totalSchools,
            icon: <Building2 className="w-4 h-4" />,
            textColor: "text-cyan-700",
            tab: "configuration",
          } as StatCard,
        ]
      : []),
    {
      title: "Employees on Leave",
      value: stats.employeesOnLeave,
      icon: <UserMinus className="w-4 h-4" />,
      textColor: "text-amber-700",
      tab: "employee-management",
    },
    {
      title: "Archived Employees",
      value: stats.archivedEmployees,
      icon: <Archive className="w-4 h-4" />,
      textColor: "text-rose-700",
      tab: "employees-list",
      intent: { key: EMPLOYEES_LIST_TAB_KEY, value: "archived" },
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      icon: <FileText className="w-4 h-4" />,
      textColor: "text-purple-700",
      tab: "user-roles",
      intent: { key: USER_ROLES_TAB_KEY, value: "pending" },
    },
  ];

  const handleCardClick = (card: StatCard) => {
    if (card.intent && typeof window !== "undefined") {
      window.localStorage.setItem(card.intent.key, card.intent.value);
    }

    if (card.tab && onTabChange) {
      onTabChange(card.tab);
    }
  };

  const handleViewLogs = () => {
    if (onTabChange) {
      onTabChange("logs");
    }
  };

  const formatLogDate = (value?: string) => {
    if (!value) {
      return "No date";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "No date";
    }

    return parsed.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getLogActor = (log: BacklogRecord) => {
    const name = `${log.first_name || ""} ${log.last_name || ""}`.trim();
    return name || "System";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-3"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-3 py-3">
        <h1 className="text-lg font-bold text-gray-900 inline-flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-blue-600" />
          Dashboard
        </h1>
        <p className="mt-0.5 text-[11px] text-gray-500">System overview</p>
      </div>

      {/* Main Content */}
      <div className="space-y-3 p-2.5">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div>
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-700">
            Stats
          </h2>
          <div className="grid grid-cols-2 gap-1.5">
            {statCards.map((stat, index) => (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick(stat)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleCardClick(stat);
                  }
                }}
                className="cursor-pointer rounded border border-gray-200 bg-white p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={`${stat.textColor} text-[11px] font-medium leading-tight`}
                    >
                      {stat.title}
                    </p>
                    <p
                      className={`${stat.textColor} mt-0.5 text-xl font-bold leading-none`}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div className={stat.textColor}>{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showRecentLogs && (
          <div className="rounded border border-gray-200 bg-white p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-yellow-600">
                Recent Logs
              </h2>
              <button
                type="button"
                onClick={handleViewLogs}
                className="cursor-pointer rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                View Logs
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:hidden">
                {recentLogs.length === 0 ? (
                  <p className="px-1 py-4 text-center text-sm text-gray-500">
                    No recent logs found.
                  </p>
                ) : (
                  recentLogs.map((log, index) => (
                    <div
                      key={log.id || index}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <p className="text-xs text-gray-400 truncate">
                        {formatLogDate(log.created_at)}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {getLogActor(log)}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {(log.action || "Activity").replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                        {log.details || "No details available."}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-130 border-collapse text-xs">
                  <thead className="bg-blue-100">
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-2 py-1 text-left font-semibold uppercase tracking-wide text-blue-600">
                        Date &amp; Time
                      </th>
                      <th className="px-2 py-1 text-left font-semibold uppercase tracking-wide text-blue-600">
                        Name
                      </th>
                      <th className="px-2 py-1 text-left font-semibold uppercase tracking-wide text-blue-600">
                        Action Taken
                      </th>
                      <th className="px-2 py-1 text-left font-semibold uppercase tracking-wide text-blue-600">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-2 py-4 text-center text-gray-500"
                        >
                          No recent logs found.
                        </td>
                      </tr>
                    ) : (
                      recentLogs.map((log, index) => (
                        <tr
                          key={log.id || index}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="px-2 py-1 text-[11px] text-gray-500 whitespace-nowrap">
                            {formatLogDate(log.created_at)}
                          </td>
                          <td className="px-2 py-1 text-[11px] font-medium text-gray-900 whitespace-nowrap">
                            {getLogActor(log)}
                          </td>
                          <td className="px-2 py-1 text-[11px] text-gray-700 whitespace-nowrap">
                            {(log.action || "Activity").replaceAll("_", " ")}
                          </td>
                          <td className="px-2 py-1 text-[11px] text-gray-600">
                            <span
                              className="block max-w-[18rem] truncate"
                              title={log.details || "No details available."}
                            >
                              {log.details || "No details available."}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
