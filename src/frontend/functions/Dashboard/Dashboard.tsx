"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Settings,
  LogOut,
  UserCheck,
} from "lucide-react";

type StatCard = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
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
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          setError("Not authenticated");
          return;
        }

        // Fetch employees
        const employeeRes = await fetch("/api/employee", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const employeeData = employeeRes.ok
          ? await employeeRes.json()
          : { data: [] };
        const totalEmployees = employeeData.data?.length || 0;

        // Fetch users
        const userRes = await fetch("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = userRes.ok ? await userRes.json() : { data: [] };
        const totalUsers = userData.data?.length || 0;

        // Fetch leave requests
        const leaveRes = await fetch("/api/leave", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const leaveData = leaveRes.ok ? await leaveRes.json() : { data: [] };

        // Filter pending and approved this month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let pendingRequests = 0;
        let approvedThisMonth = 0;

        leaveData.data?.forEach((leave: any) => {
          if (leave.status === "PENDING") {
            pendingRequests++;
          }
          if (leave.status === "APPROVED") {
            const leaveDate = new Date(leave.created_at);
            if (
              leaveDate.getMonth() === currentMonth &&
              leaveDate.getFullYear() === currentYear
            ) {
              approvedThisMonth++;
            }
          }
        });

        // Fetch pending registrations
        const registrationRes = await fetch("/api/registration/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const registrationData = registrationRes.ok
          ? await registrationRes.json()
          : { data: [] };
        const pendingRegistrations = registrationData.data?.length || 0;

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
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: "Registered system users",
      icon: <UserCheck className="w-8 h-8" />,
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      subtitle: "New accounts awaiting approval",
      icon: <FileText className="w-8 h-8 text-purple-500" />,
      color: "bg-purple-50 border-purple-200",
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
    {
      label: "Logs",
      icon: <FileText className="w-6 h-6" />,
      tab: "logs",
      description: "View system activity logs",
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
              className={`${stat.color} border rounded-lg p-6 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-gray-500 text-xs mt-2">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className="text-blue-700">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Highlights */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Quick Highlights
            </h2>
            <div className="flex flex-col gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-orange-900 font-semibold text-sm">
                      Pending Approvals
                    </p>
                    <p className="text-2xl font-bold text-orange-700">
                      {stats.pendingRequests}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Leave requests awaiting review
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-purple-900 font-semibold text-sm">
                      New Registrations
                    </p>
                    <p className="text-2xl font-bold text-purple-700">
                      {stats.pendingRegistrations}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Pending account approvals
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shortcuts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-1">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Shortcuts</h2>
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
  );
}
