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
  ArrowRight,
  Sparkles,
  Clock3,
} from "lucide-react";
import { type BacklogRecord, useDashboardData } from "./useDashboardData";
import DashboardSkeleton from "./DashboardSkeleton";

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

const getCardAccentClasses = (title: string) => {
  switch (title) {
    case "Total Employees":
      return {
        tint: "from-blue-50 to-white",
        iconWrap: "bg-blue-100 text-blue-700",
        border: "border-blue-200",
      };
    case "Total Users":
      return {
        tint: "from-emerald-50 to-white",
        iconWrap: "bg-emerald-100 text-emerald-700",
        border: "border-emerald-200",
      };
    case "Total Schools":
      return {
        tint: "from-cyan-50 to-white",
        iconWrap: "bg-cyan-100 text-cyan-700",
        border: "border-cyan-200",
      };
    case "Employees on Leave":
      return {
        tint: "from-amber-50 to-white",
        iconWrap: "bg-amber-100 text-amber-700",
        border: "border-amber-200",
      };
    case "Archived Employees":
      return {
        tint: "from-rose-50 to-white",
        iconWrap: "bg-rose-100 text-rose-700",
        border: "border-rose-200",
      };
    case "Pending Registrations":
      return {
        tint: "from-violet-50 to-white",
        iconWrap: "bg-violet-100 text-violet-700",
        border: "border-violet-200",
      };
    default:
      return {
        tint: "from-gray-50 to-white",
        iconWrap: "bg-gray-100 text-gray-700",
        border: "border-gray-200",
      };
  }
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
      icon: <Users className="h-4 w-4" />,
      textColor: "text-blue-700",
      tab: "employees-list",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <UserCheck className="h-4 w-4" />,
      textColor: "text-green-700",
      tab: "user-roles",
    },
    ...(isSuperAdmin
      ? [
          {
            title: "Total Schools",
            value: stats.totalSchools,
            icon: <Building2 className="h-4 w-4" />,
            textColor: "text-cyan-700",
            tab: "configuration",
          } as StatCard,
        ]
      : []),
    {
      title: "Employees on Leave",
      value: stats.employeesOnLeave,
      icon: <UserMinus className="h-4 w-4" />,
      textColor: "text-amber-700",
      tab: "employee-management",
    },
    {
      title: "Archived Employees",
      value: stats.archivedEmployees,
      icon: <Archive className="h-4 w-4" />,
      textColor: "text-rose-700",
      tab: "employees-list",
      intent: { key: EMPLOYEES_LIST_TAB_KEY, value: "archived" },
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      icon: <FileText className="h-4 w-4" />,
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/40 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/90 px-3 py-3 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-sm">
                <LayoutDashboard className="h-4 w-4" />
              </span>
              Dashboard
            </h1>
            <p className="mt-1 text-[11px] text-gray-500">System overview</p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 shadow-sm">
            <Sparkles className="h-3 w-3" />
            Overview
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4 p-3">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-600">
              Stats
            </h2>
            <span className="text-[10px] font-medium text-gray-400">
              Tap a card
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {statCards.map((stat, index) => {
              const accent = getCardAccentClasses(stat.title);

              return (
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
                  className={`cursor-pointer overflow-hidden rounded-2xl border bg-linear-to-br ${accent.tint} ${accent.border} p-3 shadow-sm transition active:scale-[0.98]`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`${stat.textColor} text-[11px] font-semibold leading-tight`}
                      >
                        {stat.title}
                      </p>
                      <p
                        className={`${stat.textColor} mt-1.5 text-2xl font-bold leading-none tracking-tight`}
                      >
                        {stat.value}
                      </p>
                    </div>

                    <div
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${accent.iconWrap}`}
                    >
                      {stat.icon}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-200/70 pt-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Open
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showRecentLogs && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-linear-to-r from-yellow-50 to-white px-3 py-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-yellow-700">
                  Recent Logs
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Latest activity
                </p>
              </div>

              <button
                type="button"
                onClick={handleViewLogs}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                <Clock3 className="h-3.5 w-3.5" />
                View Logs
              </button>
            </div>

            <div className="space-y-2 p-3">
              <div className="flex flex-col gap-2 sm:hidden">
                {recentLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
                    No recent logs found.
                  </div>
                ) : (
                  recentLogs.map((log, index) => (
                    <div
                      key={log.id || index}
                      className="rounded-2xl border border-gray-100 bg-linear-to-br from-gray-50 to-white px-3 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] text-gray-400">
                            {formatLogDate(log.created_at)}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                            {getLogActor(log)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                          {(log.action || "Activity").replaceAll("_", " ")}
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-gray-600 line-clamp-3">
                        {log.details || "No details available."}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden overflow-x-auto sm:block">
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
                          className="border-b border-gray-100 transition hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-2 py-1 text-[11px] text-gray-500">
                            {formatLogDate(log.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1 text-[11px] font-medium text-gray-900">
                            {getLogActor(log)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1 text-[11px] text-gray-700">
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