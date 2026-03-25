"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  FileText,
  Settings,
  UserCheck,
  UserMinus,
  Archive,
} from "lucide-react";

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

type EmployeeStatusCountsResponse = {
  data?: {
    on_leave?: number;
    archived?: number;
  };
  message?: string;
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
  subtitle?: string;
  icon: React.ReactNode;
  textColor: string;
};

type Shortcut = {
  label: string;
  icon: React.ReactNode;
  tab: string;
  description: string;
};

type DashboardProps = {
  onTabChange?: (tab: string) => void;
};

export default function Dashboard({ onTabChange }: DashboardProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalUsers: 0,
    pendingRequests: 0,
    approvedThisMonth: 0,
    pendingRegistrations: 0,
    employeesOnLeave: 0,
    archivedEmployees: 0,
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

        const [
          employees,
          users,
          leaves,
          pendingRegistrationsList,
          backlogs,
          employeeStatusCountsResponse,
        ] = await Promise.all([
          fetchApiList<Record<string, unknown>>("/api/employees", token),
          fetchApiList<Record<string, unknown>>("/api/users", token),
          fetchApiList<LeaveRecord>("/api/leave", token),
          fetchApiList<Record<string, unknown>>(
            "/api/registrations/pending",
            token,
          ),
          fetchApiList<BacklogRecord>("/api/backlogs", token),
          fetch(
            `${API_BASE_URL}/api/employees/status-counts?include_archived=true`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ).then(async (response) => {
            const payload = (await response
              .json()
              .catch(() => ({}))) as EmployeeStatusCountsResponse;

            if (!response.ok) {
              throw new Error(
                payload?.message || "Failed to fetch employee status counts.",
              );
            }

            return payload;
          }),
        ]);

        const totalEmployees = employees.length;
        const totalUsers = users.length;
        const pendingRegistrations = pendingRegistrationsList.length;
        const employeesOnLeave =
          Number(employeeStatusCountsResponse?.data?.on_leave) || 0;
        const archivedEmployees =
          Number(employeeStatusCountsResponse?.data?.archived) || 0;

        // Filter pending and approved this month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let pendingRequests = 0;
        let approvedThisMonth = 0;

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
              approvedThisMonth++;
            }
          }
        });

        setStats({
          totalEmployees,
          totalUsers,
          pendingRequests,
          approvedThisMonth,
          pendingRegistrations,
          employeesOnLeave,
          archivedEmployees,
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
      subtitle: "Active employees in system",
      icon: <Users className="w-8 h-8" />,
      textColor: "text-blue-700",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: "Registered system users",
      icon: <UserCheck className="w-8 h-8" />,
      textColor: "text-green-700",
    },
    {
      title: "Employees on Leave",
      value: stats.employeesOnLeave,
      subtitle: "Currently marked on leave",
      icon: <UserMinus className="w-8 h-8" />,
      textColor: "text-amber-700",
    },
    {
      title: "Archived Employees",
      value: stats.archivedEmployees,
      subtitle: "Inactive archived employee records",
      icon: <Archive className="w-8 h-8" />,
      textColor: "text-rose-700",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      subtitle: "New accounts awaiting approval",
      icon: <FileText className="w-8 h-8" />,
      textColor: "text-purple-700",
    },
  ];

  const shortcuts: Shortcut[] = [
    {
      label: "Employee Management",
      icon: <Users className="w-6 h-6" />,
      tab: "employee-management",
      description: "View and manage employees",
    },
    {
      label: "User & Roles",
      icon: <Settings className="w-6 h-6" />,
      tab: "user-roles",
      description: "Manage users and permissions",
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's your system overview.
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
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Logs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-yellow-600">Recent Logs</h2>
              <button
                type="button"
                onClick={handleViewLogs}
                className="cursor-pointer rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                View Logs
              </button>
            </div>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-gray-500">No recent logs found.</p>
              ) : (
                recentLogs.map((log, index) => (
                  <div
                    key={log.id || index}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {(log.action || "Activity").replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {log.details || "No details available."}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {getLogActor(log)} • {formatLogDate(log.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            {/* Shortcuts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Shortcuts
              </h2>
              <div className="flex flex-col gap-3">
                {shortcuts.map((shortcut, index) => (
                  <button
                    key={index}
                    onClick={() => handleShortcutClick(shortcut.tab)}
                    className="cursor-pointer w-full bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-blue-700 group-hover:scale-110 transition-transform">
                        {shortcut.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {shortcut.label}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {shortcut.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
