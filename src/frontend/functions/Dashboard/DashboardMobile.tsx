"use client";

import React, { useEffect, useState } from "react";
import { Users, FileText, Settings, UserCheck } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type ApiListResponse<T> = {
  data?: T[];
  message?: string;
};

type LeaveRecord = {
  status?: string;
  created_at?: string;
  date_of_action?: string;
};

type BacklogRecord = {
  id?: number;
  action?: string;
  details?: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
};

const normalizeList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const withData = payload as ApiListResponse<T>;
    if (Array.isArray(withData.data)) {
      return withData.data;
    }
  }

  return [];
};

const fetchApiList = async <T,>(
  endpoint: string,
  token: string,
): Promise<T[]> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = (await response.json().catch(() => ({}))) as
    | ApiListResponse<T>
    | T[];

  if (!response.ok) {
    throw new Error(
      (payload as ApiListResponse<T>)?.message ||
        `Failed to fetch ${endpoint}.`,
    );
  }

  return normalizeList<T>(payload);
};

type StatCard = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  textColor: string;
};

type Shortcut = {
  label: string;
  icon: React.ReactNode;
  tab: string;
};

type DashboardMobileProps = {
  onTabChange?: (tab: string) => void;
};

export default function DashboardMobile({ onTabChange }: DashboardMobileProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalUsers: 0,
    pendingRequests: 0,
    pendingRegistrations: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentLogs, setRecentLogs] = useState<BacklogRecord[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const [employees, users, leaves, pendingRegistrationsList, backlogs] =
          await Promise.all([
            fetchApiList<Record<string, unknown>>("/api/employees", token),
            fetchApiList<Record<string, unknown>>("/api/users", token),
            fetchApiList<LeaveRecord>("/api/leave", token),
            fetchApiList<Record<string, unknown>>(
              "/api/registrations/pending",
              token,
            ),
            fetchApiList<BacklogRecord>("/api/backlogs", token),
          ]);

        const totalEmployees = employees.length;
        const totalUsers = users.length;
        const pendingRegistrations = pendingRegistrationsList.length;

        // Filter pending and approved this month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let pendingRequests = 0;

        leaves.forEach((leave) => {
          const status = String(leave.status || "").toUpperCase();
          if (status === "PENDING") {
            pendingRequests++;
          }

          if (status === "APPROVED") {
            const dateSource = leave.created_at || leave.date_of_action;
            if (!dateSource) {
              return;
            }

            const leaveDate = new Date(dateSource);
            if (Number.isNaN(leaveDate.getTime())) {
              return;
            }

            if (
              leaveDate.getMonth() === currentMonth &&
              leaveDate.getFullYear() === currentYear
            ) {
              // Reserved for possible future approved-this-month widget.
            }
          }
        });

        setStats({
          totalEmployees,
          totalUsers,
          pendingRequests,
          pendingRegistrations,
        });
        setRecentLogs(backlogs.slice(0, 3));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards: StatCard[] = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: <Users className="w-5 h-5" />,
      textColor: "text-blue-700",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <UserCheck className="w-5 h-5" />,
      textColor: "text-green-700",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      icon: <FileText className="w-5 h-5" />,
      textColor: "text-purple-700",
    },
  ];

  const shortcuts: Shortcut[] = [
    {
      label: "Employee Management",
      icon: <Users className="w-5 h-5" />,
      tab: "employee-management",
    },
    {
      label: "User & Roles",
      icon: <Settings className="w-5 h-5" />,
      tab: "user-roles",
    },
  ];

  const handleShortcutClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
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
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-xs mt-1">System overview</p>
      </div>

      {/* Main Content */}
      <div className="p-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded mb-3">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mb-4">
          <h2 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Stats
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`${stat.textColor} text-xs font-medium`}>
                      {stat.title}
                    </p>
                    <p className={`${stat.textColor} text-2xl font-bold mt-1`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={stat.textColor}>{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded border border-gray-200 p-3 mb-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-yellow-600 uppercase tracking-wide">
              Recent Logs
            </h2>
            <button
              type="button"
              onClick={handleViewLogs}
              className="cursor-pointer rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              View Logs
            </button>
          </div>

          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-gray-500">No recent logs found.</p>
            ) : (
              recentLogs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="rounded border border-gray-200 p-2.5"
                >
                  <p className="text-xs font-semibold text-gray-900">
                    {(log.action || "Activity").replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {log.details || "No details available."}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {getLogActor(log)} • {formatLogDate(log.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="bg-white rounded border border-gray-200 p-3">
          <h2 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
            Shortcuts
          </h2>
          <div className="flex flex-col gap-2">
            {shortcuts.map((shortcut, index) => (
              <button
                key={index}
                onClick={() => handleShortcutClick(shortcut.tab)}
                className="cursor-pointer flex items-center gap-3 p-3 rounded bg-linear-to-b from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-400 hover:shadow active:bg-blue-200 transition-all text-left"
              >
                <div className="text-blue-700">{shortcut.icon}</div>
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {shortcut.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
