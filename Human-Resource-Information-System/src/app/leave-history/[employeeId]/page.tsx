"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Printer } from "lucide-react";
import RoleGuard from "@/frontend/auth/RoleGuard";
import LeaveHistoryTable from "@/frontend/functions/LeaveManagement/LeaveHistoryTable";
import {
  getLeaveHistoryByEmployee,
  type LeaveHistoryRecord,
} from "@/frontend/functions/LeaveManagement/leaveApi";
import PrintableLeaveCard, {
  createLeaveCardFileName,
  downloadLeaveCardPdf,
} from "@/frontend/functions/LeaveManagement/PrintableLeaveCard";

type EmployeeInfo = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  employee_type: "teaching" | "non-teaching";
  email?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function LeaveHistoryContent() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = Number(params?.employeeId);

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [rows, setRows] = useState<LeaveHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const printableRef = useRef<HTMLDivElement | null>(null);

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

  const employeeFullName = employee
    ? [employee.first_name, employee.middle_name, employee.last_name]
        .filter(Boolean)
        .join(" ")
    : "";

  const handlePrintPdf = async () => {
    if (!employee || !printableRef.current || isDownloadingPdf || loading) {
      return;
    }

    try {
      setIsDownloadingPdf(true);
      setError(null);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const fileName = createLeaveCardFileName(employeeFullName);
      await downloadLeaveCardPdf(printableRef.current, fileName);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate PDF file.",
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!employeeId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-red-500">
        Invalid employee ID.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-xl border border-blue-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900">
              <FileText size={24} className="text-blue-600" />
              Leave History
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Employee: {employee ? employeeFullName : "Loading..."}
            </p>

            {employee?.email && (
              <p className="text-sm text-gray-500">Email: {employee.email}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handlePrintPdf()}
            disabled={!employee || loading || isDownloadingPdf}
            className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Printer size={16} />
            {isDownloadingPdf ? "Generating PDF..." : "Print"}
          </button>
        </div>

        <div className="mt-4">
          <LeaveHistoryTable rows={rows} loading={loading} error={error} />
        </div>

        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-100000px",
            top: 0,
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <PrintableLeaveCard
            ref={printableRef}
            employeeName={employeeFullName}
            employeeType={employee?.employee_type ?? "teaching"}
            rows={rows}
          />
        </div>
      </div>
    </div>
  );
}

export default function LeaveHistoryPage() {
  return (
    <RoleGuard pageId="leave-management" fallback={null}>
      <LeaveHistoryContent />
    </RoleGuard>
  );
}