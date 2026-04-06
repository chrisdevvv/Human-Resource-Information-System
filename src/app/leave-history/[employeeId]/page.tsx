"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
import LeaveHistoryTable from "@/frontend/functions/LeaveManagement/LeaveHistoryTable";
import {
  getLeaveHistoryByEmployee,
  type LeaveHistoryRecord,
} from "@/frontend/functions/LeaveManagement/leaveApi";

type EmployeeInfo = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  employee_type: "teaching" | "non-teaching";
  email?: string | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function LeaveHistoryPage() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = Number(params?.employeeId);

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [rows, setRows] = useState<LeaveHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Not authenticated. Please log in first.");

        const [empRes, leaveRows] = await Promise.all([
          fetch(`${API_BASE}/api/employees/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          getLeaveHistoryByEmployee(employeeId),
        ]);

        if (!empRes.ok) {
          throw new Error("Failed to fetch employee information.");
        }

        const empData = (await empRes.json()) as
          | EmployeeInfo
          | { data: EmployeeInfo };
        const emp =
          "data" in empData && empData.data
            ? empData.data
            : (empData as EmployeeInfo);

        setEmployee(emp);
        setRows(leaveRows);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [employeeId]);

  if (!employeeId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-red-500">
        Invalid employee ID.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
          <FileText size={24} className="text-blue-600" />
          Leave History
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Employee:{" "}
          {employee
            ? [employee.first_name, employee.middle_name, employee.last_name]
                .filter(Boolean)
                .join(" ")
            : "Loading..."}
        </p>

        {employee?.email && (
          <p className="text-sm text-gray-500">Email: {employee.email}</p>
        )}

        <div className="mt-4">
          <LeaveHistoryTable rows={rows} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}
