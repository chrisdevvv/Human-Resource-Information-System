"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, RefreshCcw, X } from "lucide-react";
import type { LeaveModalRecord } from "./leaveTypes";
import AddLeaveModal, { type AddLeaveFormValues } from "./AddLeaveModal";
import LeaveHistoryTable from "./LeaveHistoryTable";
import PrintableLeaveCard, {
  createLeaveCardFileName,
  downloadLeaveCardPdf,
} from "./PrintableLeaveCard";
import {
  createLeave,
  getLeaveHistoryByEmployee,
  type LeaveHistoryRecord,
} from "./leaveApi";

type LeaveManagementModalProps = {
  isOpen: boolean;
  leave: LeaveModalRecord | null;
  onClose: () => void;
  initialTab?: "history" | "card";
};

export default function LeaveManagementModal({
  isOpen,
  leave,
  onClose,
  initialTab = "history",
}: LeaveManagementModalProps) {
  const employeeId = leave?.employeeId ?? leave?.id ?? null;
  const employeeType = leave?.employeeType ?? "non-teaching";

  const [activeTab, setActiveTab] = useState<"history" | "card">("history");
  const [historyRows, setHistoryRows] = useState<LeaveHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfCooldownRemaining, setPdfCooldownRemaining] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const pdfCooldownIntervalRef = useRef<number | null>(null);

  const employeeTypeLabel =
    employeeType === "non-teaching" ? "Non-Teaching" : "Teaching";

  const pdfFileName = useMemo(() => {
    return createLeaveCardFileName(leave?.fullName);
  }, [leave?.fullName]);

  const fetchHistory = async (showSpinner = true) => {
    if (!employeeId) return;

    try {
      if (showSpinner) setLoading(true);
      const rows = await getLeaveHistoryByEmployee(employeeId);
      setHistoryRows(rows);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch leave history.",
      );
      if (showSpinner) {
        setHistoryRows([]);
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !employeeId) return;
    setActiveTab(initialTab);
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employeeId, initialTab]);

  useEffect(() => {
    return () => {
      if (pdfCooldownIntervalRef.current !== null) {
        window.clearInterval(pdfCooldownIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen || !leave || !employeeId) {
    return null;
  }

  const handleCreate = async (payload: AddLeaveFormValues) => {
    try {
      setIsSaving(true);
      await createLeave({
        employee_id: payload.employee_id,
        period_of_leave: payload.period_of_leave,
        particulars: payload.particulars,
        earned_vl: payload.earned_vl,
        abs_with_pay_vl: payload.abs_with_pay_vl,
        abs_without_pay_vl: payload.abs_without_pay_vl,
        earned_sl: payload.earned_sl,
        abs_with_pay_sl: payload.abs_with_pay_sl,
        abs_without_pay_sl: payload.abs_without_pay_sl,
      });
      await fetchHistory(false);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to create leave entry.",
      );
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (pdfCooldownRemaining > 0) return;

    setPdfCooldownRemaining(4);
    if (pdfCooldownIntervalRef.current !== null) {
      window.clearInterval(pdfCooldownIntervalRef.current);
    }
    pdfCooldownIntervalRef.current = window.setInterval(() => {
      setPdfCooldownRemaining((prev) => {
        if (prev <= 1) {
          if (pdfCooldownIntervalRef.current !== null) {
            window.clearInterval(pdfCooldownIntervalRef.current);
            pdfCooldownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      setActiveTab("card");
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      if (!cardRef.current) return;
      await downloadLeaveCardPdf(cardRef.current, pdfFileName);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export PDF.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
      <div className="relative flex max-h-[94vh] w-full max-w-screen-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Leave Management Details
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Employee: {leave.fullName}
              </p>
              <p className="text-sm text-gray-500">
                Employee Type: {employeeTypeLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
              aria-label="Close"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "history"
                  ? "hover:bg-blue-700 bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Leave History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("card")}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "card"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Printable Leave Card
            </button>

            <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={14} />
                Add Leave
              </button>
              <button
                type="button"
                onClick={() => fetchHistory(true)}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw size={14} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isSaving || pdfCooldownRemaining > 0}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={14} />
                {pdfCooldownRemaining > 0
                  ? `Download PDF (${pdfCooldownRemaining}s)`
                  : "Download PDF"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === "history" ? (
            <LeaveHistoryTable
              rows={historyRows}
              loading={loading}
              error={error}
            />
          ) : (
            <PrintableLeaveCard
              ref={cardRef}
              employeeName={leave.fullName}
              employeeType={employeeType}
              rows={historyRows}
            />
          )}
        </div>
      </div>

      <AddLeaveModal
        isOpen={isAddOpen}
        employeeId={employeeId}
        employeeName={leave.fullName}
        onClose={() => setIsAddOpen(false)}
        onSave={handleCreate}
        isSaving={isSaving}
      />
    </div>
  );
}
