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

const getCardAccentClasses = (title: string) => {
  switch (title) {
    case "Total Employees":
      return {
        ring: "ring-blue-100",
        tint: "from-blue-50 to-white",
        iconWrap: "bg-blue-100 text-blue-700",
        hover: "hover:border-blue-300",
      };
    case "Total Users":
      return {
        ring: "ring-emerald-100",
        tint: "from-emerald-50 to-white",
        iconWrap: "bg-emerald-100 text-emerald-700",
        hover: "hover:border-emerald-300",
      };
    case "Total Schools":
      return {
        ring: "ring-cyan-100",
        tint: "from-cyan-50 to-white",
        iconWrap: "bg-cyan-100 text-cyan-700",
        hover: "hover:border-cyan-300",
      };
    case "Employees on Leave":
      return {
        ring: "ring-amber-100",
        tint: "from-amber-50 to-white",
        iconWrap: "bg-amber-100 text-amber-700",
        hover: "hover:border-amber-300",
      };
    case "Archived Employees":
      return {
        ring: "ring-rose-100",
        tint: "from-rose-50 to-white",
        iconWrap: "bg-rose-100 text-rose-700",
        hover: "hover:border-rose-300",
      };
    case "Pending Registrations":
      return {
        ring: "ring-violet-100",
        tint: "from-violet-50 to-white",
        iconWrap: "bg-violet-100 text-violet-700",
        hover: "hover:border-violet-300",
      };
    default:
      return {
        ring: "ring-gray-100",
        tint: "from-gray-50 to-white",
        iconWrap: "bg-gray-100 text-gray-700",
        hover: "hover:border-gray-300",
      };
  }
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
      icon: <Users className="h-7 w-7" />,
      textColor: "text-blue-700",
      tab: "employees-list",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: "Registered system users",
      icon: <UserCheck className="h-7 w-7" />,
      textColor: "text-green-700",
      tab: "user-roles",
    },
    ...(isSuperAdmin
      ? [
          {
            title: "Total Schools",
            value: stats.totalSchools,
            subtitle: "Registered schools in system",
            icon: <Building2 className="h-7 w-7" />,
            textColor: "text-cyan-700",
            tab: "configuration",
          } as StatCard,
        ]
      : []),
    {
      title: "Employees on Leave",
      value: stats.employeesOnLeave,
      subtitle: "Currently marked on leave",
      icon: <UserMinus className="h-7 w-7" />,
      textColor: "text-amber-700",
      tab: "employee-management",
    },
    {
      title: "Archived Employees",
      value: stats.archivedEmployees,
      subtitle: "Inactive archived employee records",
      icon: <Archive className="h-7 w-7" />,
      textColor: "text-rose-700",
      tab: "employees-list",
      intent: { key: EMPLOYEES_LIST_TAB_KEY, value: "archived" },
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      subtitle: "New accounts awaiting approval",
      icon: <FileText className="h-7 w-7" />,
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/40">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/85 px-6 py-6 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="inline-flex items-center gap-3 text-3xl font-bold text-gray-900">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
                  <LayoutDashboard className="h-6 w-6" />
                </span>
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600 sm:text-base">
                Welcome back! Here&apos;s your system overview.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl p-6">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                className={`group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br ${accent.tint} p-6 shadow-sm ring-1 ${accent.ring} transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${accent.hover}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${stat.textColor}`}>
                      {stat.title}
                    </p>
                    <p className={`mt-3 text-4xl font-bold tracking-tight ${stat.textColor}`}>
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <p className="mt-3 text-sm leading-relaxed text-gray-500">
                        {stat.subtitle}
                      </p>
                    )}
                  </div>

                  <div
                    className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${accent.iconWrap}`}
                  >
                    {stat.icon}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-200/70 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    View details
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

        {showRecentLogs && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 bg-linear-to-r from-yellow-50 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-yellow-700">
                  Recent Logs
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Latest activity across the system.
                </p>
              </div>

              <button
                type="button"
                onClick={handleViewLogs}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                <Clock3 className="h-4 w-4" />
                View Logs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-205 border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-blue-100/90 backdrop-blur">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-blue-700">
                      Date &amp; Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-blue-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-blue-700">
                      Action Taken
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-blue-700">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        No recent logs found.
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((log, index) => (
                      <tr
                        key={log.id || index}
                        className="border-b border-gray-100 transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {formatLogDate(log.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">
                          {getLogActor(log)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
                            {(log.action || "Activity").replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span
                            className="block max-w-xl truncate"
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