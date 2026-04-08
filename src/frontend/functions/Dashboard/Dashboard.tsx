"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  FileText,
  UserCheck,
  UserMinus,
  Archive,
  Building2,
  LayoutDashboard,
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

const normalizeRole = (role: unknown) =>
  String(role || "")
    .trim()
    .replace(/[_\s]+/g, "-")
    .toUpperCase();

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
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalUsers: 0,
    totalSchools: 0,
    pendingRequests: 0,
    approvedThisMonth: 0,
    pendingRegistrations: 0,
    employeesOnLeave: 0,
    archivedEmployees: 0,
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentLogs, setRecentLogs] = useState<BacklogRecord[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const rawUser = localStorage.getItem("user");

        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        let currentUserRole = "";
        let currentUserSchoolId: number | null = null;

        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser) as {
              role?: string;
              school_id?: number | string;
            };
            currentUserRole = normalizeRole(parsed.role);
            const parsedSchoolId = Number(parsed.school_id);
            currentUserSchoolId = Number.isFinite(parsedSchoolId)
              ? parsedSchoolId
              : null;
          } catch {
            currentUserRole = "";
            currentUserSchoolId = null;
          }
        }

        const isAdmin = currentUserRole === "ADMIN";
        const isSuperAdminRole = currentUserRole === "SUPER-ADMIN";
        setIsSuperAdmin(isSuperAdminRole);
        const scopedEmployeesEndpoint =
          isAdmin && currentUserSchoolId
            ? `/api/employees/school/${currentUserSchoolId}`
            : "/api/employees";
        const scopedUsersEndpoint =
          isAdmin && currentUserSchoolId
            ? `/api/users?school_id=${currentUserSchoolId}`
            : "/api/users";
        const statusCountsUrl =
          `${API_BASE_URL}/api/employees/status-counts?include_archived=true` +
          (isAdmin && currentUserSchoolId
            ? `&school_id=${currentUserSchoolId}`
            : "");

        const [
          employees,
          users,
          leaves,
          pendingRegistrationsList,
          schools,
          backlogs,
          employeeStatusCountsResponse,
        ] = await Promise.all([
          fetchApiList<Record<string, unknown>>(scopedEmployeesEndpoint, token),
          fetchApiList<Record<string, unknown>>(scopedUsersEndpoint, token),
          fetchApiList<LeaveRecord>("/api/leave", token),
          fetchApiList<Record<string, unknown>>(
            "/api/registrations/pending",
            token,
          ),
          isSuperAdminRole
            ? fetchApiList<Record<string, unknown>>("/api/schools", token)
            : Promise.resolve([]),
          showRecentLogs
            ? fetchApiList<BacklogRecord>("/api/backlogs", token)
            : Promise.resolve([]),
          fetch(statusCountsUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(async (response) => {
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
        const totalSchools = schools.length;
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
          totalSchools,
          pendingRequests,
          approvedThisMonth,
          pendingRegistrations,
          employeesOnLeave,
          archivedEmployees,
        });
        setRecentLogs(showRecentLogs ? backlogs.slice(0, 3) : []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showRecentLogs]);

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
        )}
      </div>
    </div>
  );
}
