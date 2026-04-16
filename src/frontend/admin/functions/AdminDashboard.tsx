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

type AdminDashboardProps = {
  onTabChange?: (tab: string) => void;
};

export default function AdminDashboard({ onTabChange }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalUsers: 0,
    pendingRequests: 0,
    approvedThisMonth: 0,
    pendingRegistrations: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const [employees, users, leaves, pendingRegistrationsList] =
          await Promise.all([
            fetchApiList<Record<string, unknown>>("/api/employees", token),
            fetchApiList<Record<string, unknown>>("/api/users", token),
            fetchApiList<LeaveRecord>("/api/leave", token),
            fetchApiList<Record<string, unknown>>(
              "/api/registrations/pending",
              token,
            ),
          ]);

        const totalEmployees = employees.length;
        const totalUsers = users.length;
        const pendingRegistrations = pendingRegistrationsList.length;

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
        });
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
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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
              className="bg-white border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
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
      </div>
    </div>
  );
}
