"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Clock,
  FileText,
  Settings,
  UserCheck,
} from "lucide-react";

type StatCard = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
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
      icon: <Users className="w-5 h-5" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <UserCheck className="w-5 h-5" />,
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      icon: <FileText className="w-5 h-5 text-purple-500" />,
      color: "bg-purple-50 border-purple-200",
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
    {
      label: "Logs",
      icon: <FileText className="w-5 h-5" />,
      tab: "logs",
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
                className={`${stat.color} border rounded p-3`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-gray-600 text-xs font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className="text-blue-700">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="bg-white rounded border border-gray-200 p-3 mb-4">
          <h2 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
            Quick Highlights
          </h2>
          <div className="flex flex-col gap-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-orange-900 font-semibold text-xs">
                    Pending Approvals
                  </p>
                  <p className="text-xl font-bold text-orange-700">
                    {stats.pendingRequests}
                  </p>
                  <p className="text-xs text-orange-600">
                    Leave requests awaiting review
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded p-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-purple-900 font-semibold text-xs">
                    New Registrations
                  </p>
                  <p className="text-xl font-bold text-purple-700">
                    {stats.pendingRegistrations}
                  </p>
                  <p className="text-xs text-purple-600">
                    Pending account approvals
                  </p>
                </div>
              </div>
            </div>
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
