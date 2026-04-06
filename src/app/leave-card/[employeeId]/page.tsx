"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import PrintableLeaveCard, {
  createLeaveCardFileName,
  downloadLeaveCardPdf,
} from "@/frontend/functions/LeaveManagement/PrintableLeaveCard";
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
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function LeaveCardPreviewPage() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = Number(params?.employeeId);

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [rows, setRows] = useState<LeaveHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleDownload = async () => {
    if (!employee || !cardRef.current) return;

    try {
      setIsPdfLoading(true);
      const employeeName =
        [employee.first_name, employee.middle_name, employee.last_name]
          .filter(Boolean)
          .join(" ") || "Employee";
      await downloadLeaveCardPdf(
        cardRef.current,
        createLeaveCardFileName(employeeName),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;

    try {
      setIsPrintLoading(true);
      // Wait one frame so the latest UI state is painted before opening print.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      window.print();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to open print view.");
    } finally {
      setIsPrintLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading leave card...
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-red-500">
        {error ?? "Employee not found."}
      </div>
    );
  }

  const fullName = [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-gray-100 print:min-h-0 print:bg-white">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3 shadow-sm print:hidden">
        <span className="text-sm font-medium text-gray-700">
          Leave Card Preview - <span className="text-gray-900">{fullName}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrintLoading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Printer size={14} />
            {isPrintLoading ? "Opening..." : "Print"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isPdfLoading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={14} />
            {isPdfLoading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="p-6 print:p-0">
        <PrintableLeaveCard
          ref={cardRef}
          employeeName={fullName}
          employeeType={employee.employee_type ?? "non-teaching"}
          rows={rows}
        />
      </div>
    </div>
  );
}
