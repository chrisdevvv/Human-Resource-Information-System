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
import DashboardSkeleton from "./DashboardSkeleton";

type StatCard = {
  title: string;
  value: number | string;
  subtitle?: string;
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

type DashboardProps = {
  onTabChange?: (tab: string) => void;
  showRecentLogs?: boolean;
};

export default function Dashboard({
  onTabChange,
  showRecentLogs = true,
}: DashboardProps) {
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
      subtitle: "Active employees in system",
      icon: <Users className="w-8 h-8" />,
      textColor: "text-blue-700",
      tab: "employees-list",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: "Registered system users",
      icon: <UserCheck className="w-8 h-8" />,
      textColor: "text-green-700",
      tab: "user-roles",
    },
    ...(isSuperAdmin
      ? [
          {
            title: "Total Schools",
            value: stats.totalSchools,
            subtitle: "Registered schools in system",
            icon: <Building2 className="w-8 h-8" />,
            textColor: "text-cyan-700",
            tab: "configuration",
          } as StatCard,
        ]
      : []),
    {
      title: "Employees on Leave",
      value: stats.employeesOnLeave,
      subtitle: "Currently marked on leave",
      icon: <UserMinus className="w-8 h-8" />,
      textColor: "text-amber-700",
      tab: "employee-management",
    },
    {
      title: "Archived Employees",
      value: stats.archivedEmployees,
      subtitle: "Inactive archived employee records",
      icon: <Archive className="w-8 h-8" />,
      textColor: "text-rose-700",
      tab: "employees-list",
      intent: { key: EMPLOYEES_LIST_TAB_KEY, value: "archived" },
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      subtitle: "New accounts awaiting approval",
      icon: <FileText className="w-8 h-8" />,
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
    return <DashboardSkeleton showRecentLogs={showRecentLogs} />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 inline-flex items-center gap-2">
          <LayoutDashboard className="h-7 w-7 text-blue-600" />
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s your system overview.
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              className="cursor-pointer bg-white border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`${stat.textColor} text-sm font-medium`}>
                    {stat.title}
                  </p>
                  <p className={`${stat.textColor} text-3xl font-bold mt-2`}>
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className={`${stat.textColor} text-xs mt-2 opacity-80`}>
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={stat.textColor}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {showRecentLogs && (
          <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-yellow-600">Recent Logs</h2>
              <button
                type="button"
                onClick={handleViewLogs}
                className="cursor-pointer rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                View Logs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-180 border-collapse text-sm">
                <thead className="bg-blue-100">
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-3 py-1.5 text-left text-sm font-semibold uppercase tracking-wide text-blue-600">
                      Date &amp; Time
                    </th>
                    <th className="px-3 py-1.5 text-left text-sm font-semibold uppercase tracking-wide text-blue-600">
                      Name
                    </th>
                    <th className="px-3 py-1.5 text-left text-sm font-semibold uppercase tracking-wide text-blue-600">
                      Action Taken
                    </th>
                    <th className="px-3 py-1.5 text-left text-sm font-semibold uppercase tracking-wide text-blue-600">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-gray-500"
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
                        <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-500">
                          {formatLogDate(log.created_at)}
                        </td>
                        <td className="px-3 py-1.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {getLogActor(log)}
                        </td>
                        <td className="px-3 py-1.5 text-sm text-gray-700 whitespace-nowrap">
                          {(log.action || "Activity").replaceAll("_", " ")}
                        </td>
                        <td className="px-3 py-1.5 text-sm text-gray-600">
                          <span
                            className="block max-w-md truncate"
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
        )}
      </div>
    </div>
  );
}
