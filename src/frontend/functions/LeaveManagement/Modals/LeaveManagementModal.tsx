"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  IdCard,
  Plus,
  RefreshCcw,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import DeleteEntryConfirmation from "./DeleteEntryConfirmation";
import MarkLeaveConfirmationModal from "./MarkLeaveConfirmationModal";
import type { LeaveModalRecord } from "../leaveTypes";
import AddLeaveModal, { type AddLeaveFormValues } from "./AddLeaveModal";
import LeaveHistoryTable from "../LeaveHistoryTable";
import PrintableLeaveCard, {
  createLeaveCardFileName,
  downloadLeaveCardPdf,
} from "../PrintableLeaveCard";
import {
  createLeave,
  deleteLeave,
  getLeaveHistoryByEmployee,
  type LeaveHistoryRecord,
} from "../leaveApi";
import { getLeaveHistoryRoute } from "@/frontend/route";

type LeaveManagementModalProps = {
  isOpen: boolean;
  leave: LeaveModalRecord | null;
  onClose: () => void;
  initialTab?: "history" | "card";
  onLeaveStatusChanged?: () => void;
};

type EmployeeDetailResponse = {
  data?: {
    on_leave?: boolean | number | string | null;
    email?: string | null;
    school_name?: string | null;
  };
  message?: string;
};

export default function LeaveManagementModal({
  isOpen,
  leave,
  onClose,
  initialTab = "history",
  onLeaveStatusChanged,
}: LeaveManagementModalProps) {
  const [isMarkedOnLeave, setIsMarkedOnLeave] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeSchoolFromApi, setEmployeeSchoolFromApi] = useState("");
  const [isLeaveStatusLoading, setIsLeaveStatusLoading] = useState(false);
  const [isLeaveStatusUpdating, setIsLeaveStatusUpdating] = useState(false);
  const [leaveStatusError, setLeaveStatusError] = useState<string | null>(null);
  const [isMarkLeaveConfirmOpen, setIsMarkLeaveConfirmOpen] = useState(false);
  const [pendingLeaveStatus, setPendingLeaveStatus] = useState<boolean | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pdfCooldownRemaining, setPdfCooldownRemaining] = useState(0);
  const pdfCooldownIntervalRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const employeeId = leave?.employeeId ?? leave?.id ?? null;
  const employeeType = leave?.employeeType ?? "non-teaching";
  const employeeSchool =
    employeeSchoolFromApi || (leave?.schoolName || "").trim() || "N/A";
  const [activeTab, setActiveTab] = useState<"history" | "card">("history");
  const [historyViewTab, setHistoryViewTab] = useState<
    "leave-records" | "monthly-credit"
  >("leave-records");
  const [historyRows, setHistoryRows] = useState<LeaveHistoryRecord[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<number>>(
    new Set(),
  );
  const [isDeletingEntries, setIsDeletingEntries] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const employeeTypeLabel =
    employeeType === "non-teaching" ? "Non-Teaching" : "Teaching";

  const isMonthlyCreditRow = (row: LeaveHistoryRecord) => {
    const particulars = String(row.particulars || "")
      .trim()
      .toLowerCase();
    return particulars.includes("monthly") && particulars.includes("credit");
  };

  const filteredHistoryRows = useMemo(() => {
    if (historyViewTab === "monthly-credit") {
      return historyRows.filter((row) => isMonthlyCreditRow(row));
    }

    return historyRows.filter((row) => !isMonthlyCreditRow(row));
  }, [historyRows, historyViewTab]);

  const toBool = (value: unknown) => {
    if (value === true || value === 1 || value === "1") return true;
    if (typeof value === "string") {
      return value.trim().toLowerCase() === "true";
    }
    return false;
  };

  const fetchEmployeeLeaveStatus = async () => {
    if (!employeeId) return;

    try {
      setIsLeaveStatusLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/employees/${employeeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const body = (await response.json()) as EmployeeDetailResponse;
      if (!response.ok) {
        throw new Error(body.message || "Failed to fetch employee status.");
      }

      setIsMarkedOnLeave(toBool(body.data?.on_leave));
      setEmployeeEmail(String(body.data?.email || "").trim());
      setEmployeeSchoolFromApi(String(body.data?.school_name || "").trim());
      setLeaveStatusError(null);
    } catch (err) {
      setLeaveStatusError(
        err instanceof Error ? err.message : "Failed to fetch leave status.",
      );
    } finally {
      setIsLeaveStatusLoading(false);
    }
  };

  const updateLeaveStatus = async (nextChecked: boolean) => {
    if (!employeeId || isLeaveStatusUpdating) return;

    const previousChecked = isMarkedOnLeave;
    setIsLeaveStatusUpdating(true);
    setLeaveStatusError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const endpoint = nextChecked
        ? `/api/employees/${employeeId}/mark-on-leave`
        : `/api/employees/${employeeId}/mark-available`;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${endpoint}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: nextChecked ? JSON.stringify({}) : undefined,
        },
      );

      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.message || "Failed to update employee leave status.",
        );
      }

      setIsMarkedOnLeave(nextChecked);
      onLeaveStatusChanged?.();
    } catch (err) {
      setIsMarkedOnLeave(previousChecked);
      setLeaveStatusError(
        err instanceof Error ? err.message : "Failed to update leave status.",
      );
    } finally {
      setIsLeaveStatusUpdating(false);
      setIsMarkLeaveConfirmOpen(false);
      setPendingLeaveStatus(null);
    }
  };

  const requestLeaveStatusChange = () => {
    if (!employeeId || isLeaveStatusUpdating || isLeaveStatusLoading) return;

    setPendingLeaveStatus(!isMarkedOnLeave);
    setLeaveStatusError(null);
    setIsMarkLeaveConfirmOpen(true);
  };

  const handleLeaveStatusToggle = (
    event: React.MouseEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();
    requestLeaveStatusChange();
  };

  const handleConfirmLeaveStatusChange = () => {
    if (pendingLeaveStatus === null) return;
    void updateLeaveStatus(pendingLeaveStatus);
  };

  const handleCloseLeaveStatusConfirm = () => {
    if (isLeaveStatusUpdating) return;
    setIsMarkLeaveConfirmOpen(false);
    setPendingLeaveStatus(null);
  };

  const pdfFileName = useMemo(() => {
    return createLeaveCardFileName(leave?.fullName);
  }, [leave?.fullName]);

  const fetchHistory = async (showSpinner = true) => {
    if (!employeeId) return;

    try {
      if (showSpinner) setLoading(true);
      const rows = await getLeaveHistoryByEmployee(employeeId);
      setHistoryRows(rows);
      setSelectedHistoryIds((prev) => {
        const validIds = new Set(rows.map((row) => row.id));
        const next = new Set<number>();
        prev.forEach((id) => {
          if (validIds.has(id)) next.add(id);
        });
        return next;
      });
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
    setHistoryViewTab("leave-records");
    setIsDeleteMode(false);
    setSelectedHistoryIds(new Set());
    setEmployeeSchoolFromApi("");
    void fetchHistory();
    void fetchEmployeeLeaveStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employeeId, initialTab]);

  useEffect(() => {
    if (activeTab !== "history") {
      setIsDeleteMode(false);
      setSelectedHistoryIds(new Set());
    }
  }, [activeTab]);

  useEffect(() => {
    setIsDeleteMode(false);
    setSelectedHistoryIds(new Set());
  }, [historyViewTab]);

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

  const employeeNameDisplay = leave.fullName?.trim() || "N/A";
  const employeeEmailDisplay = employeeEmail || "No email provided";

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

  const handleOpenHistoryInNewTab = () => {
    window.open(getLeaveHistoryRoute(employeeId), "_blank");
  };

  const handleToggleHistoryRow = (rowId: number) => {
    setSelectedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const handleToggleAllHistoryRows = () => {
    const allRowIds = filteredHistoryRows.map((row) => row.id);
    const areAllSelected =
      allRowIds.length > 0 &&
      allRowIds.every((rowId) => selectedHistoryIds.has(rowId));

    if (areAllSelected) {
      setSelectedHistoryIds(new Set());
      return;
    }

    setSelectedHistoryIds(new Set(allRowIds));
  };

  const handleDeleteSelectedEntries = async () => {
    if (isDeletingEntries) return;

    if (!isDeleteMode) {
      setIsDeleteMode(true);
      setSelectedHistoryIds(new Set());
      return;
    }

    if (selectedHistoryIds.size === 0) {
      setError("Please select at least one entry to delete.");
      return;
    }

    setIsDeleteConfirmOpen(true);
  };

  const handleCancelDeleteMode = () => {
    if (isDeletingEntries) return;
    setIsDeleteMode(false);
    setSelectedHistoryIds(new Set());
    setError(null);
  };

  const confirmDeleteSelectedEntries = async () => {
    setIsDeleteConfirmOpen(false);
    const toDelete = Array.from(selectedHistoryIds);
    setIsDeletingEntries(true);
    setError(null);

    try {
      for (const leaveId of toDelete) {
        await deleteLeave(leaveId);
      }
      setSelectedHistoryIds(new Set());
      setIsDeleteMode(false);
      await fetchHistory(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete leave entries.",
      );
    } finally {
      setIsDeletingEntries(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-3 py-4 sm:flex sm:items-center sm:justify-center sm:px-4">
      <div className="mx-auto my-4 flex w-full max-w-screen-2xl flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl max-h-[calc(100dvh-2rem)]">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                Leave Management Details
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                View leave history, manage entries, and generate leave card.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
              aria-label="Close"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                Employee Name
              </span>
              <input
                type="text"
                value={employeeNameDisplay}
                readOnly
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                Email Address
              </span>
              <input
                type="text"
                value={employeeEmailDisplay}
                readOnly
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                Employee Type
              </span>
              <input
                type="text"
                value={employeeTypeLabel}
                readOnly
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                School
              </span>
              <input
                type="text"
                value={employeeSchool}
                readOnly
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-linear-to-r from-slate-50 to-blue-50 p-4">
            <div className="flex items-start gap-3">
              <input
                id="mark-on-leave"
                type="checkbox"
                checked={isMarkedOnLeave}
                onClick={handleLeaveStatusToggle}
                onChange={() => {}}
                disabled={isLeaveStatusLoading || isLeaveStatusUpdating}
                className="mt-1 h-6 w-6 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="mark-on-leave"
                  onClick={(event) => {
                    event.preventDefault();
                    requestLeaveStatusChange();
                  }}
                  className="cursor-pointer text-base font-bold text-gray-800 sm:text-lg"
                >
                  Mark as on leave
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  Toggle employee leave availability status.
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  Status:{" "}
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      isMarkedOnLeave
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isMarkedOnLeave ? "On leave" : "Not on leave"}
                  </span>
                </p>
                {leaveStatusError && (
                  <p className="mt-2 text-sm text-red-500">{leaveStatusError}</p>
                )}
              </div>
            </div>
          </div>

          {/* ================= DESKTOP ACTION/TAB BAR ================= */}
          <div className="mt-4 hidden flex-wrap items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "history"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FileText size={16} />
              Leave History
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("card")}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "card"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <IdCard size={16} />
              Printable Leave Card
            </button>

            <button
              type="button"
              onClick={handleOpenHistoryInNewTab}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              <ExternalLink size={16} />
              Open in Another Tab
            </button>

            <button
              type="button"
              onClick={handleDeleteSelectedEntries}
              disabled={activeTab !== "history" || isDeletingEntries}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              {isDeleteMode
                ? `Delete Entry (${selectedHistoryIds.size})`
                : "Select Entries to Delete"}
            </button>

            {isDeleteMode && (
              <button
                type="button"
                onClick={handleCancelDeleteMode}
                disabled={isDeletingEntries}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle size={16} />
                Cancel
              </button>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                Add Leave
              </button>

              <button
                type="button"
                onClick={() => fetchHistory(true)}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isSaving || pdfCooldownRemaining > 0}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                {pdfCooldownRemaining > 0
                  ? `Download PDF (${pdfCooldownRemaining}s)`
                  : "Download PDF"}
              </button>
            </div>
          </div>

          {/* ================= MOBILE ACTION/TAB BLOCK (COMPACT) ================= */}
          <div className="mt-3 space-y-2 lg:hidden">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                  activeTab === "history"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <FileText size={14} className="mx-auto mb-0.5" />
                History
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                  activeTab === "card"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <IdCard size={14} className="mx-auto mb-0.5" />
                Card
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              disabled={isSaving}
              className="w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={14} />
                Add Leave
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fetchHistory(true)}
                disabled={isSaving}
                className="rounded-xl bg-gray-100 py-2 text-xs font-semibold text-gray-700"
              >
                <RefreshCcw size={14} className="mx-auto mb-0.5" />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isSaving || pdfCooldownRemaining > 0}
                className="rounded-xl bg-rose-500 py-2 text-xs font-semibold text-white"
              >
                <Download size={14} className="mx-auto mb-0.5" />
                {pdfCooldownRemaining > 0 ? `${pdfCooldownRemaining}s` : "PDF"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenHistoryInNewTab}
              className="w-full rounded-xl bg-gray-100 py-2 text-xs font-semibold text-gray-700"
            >
              Open in Tab
            </button>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleDeleteSelectedEntries}
                disabled={activeTab !== "history" || isDeletingEntries}
                className="w-full rounded-xl bg-red-600 py-2 text-xs font-semibold text-white"
              >
                {isDeleteMode
                  ? `Delete (${selectedHistoryIds.size})`
                  : "Select to Delete"}
              </button>

              {isDeleteMode && (
                <button
                  type="button"
                  onClick={handleCancelDeleteMode}
                  className="mt-1 w-full rounded-xl bg-gray-200 py-2 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {activeTab === "history" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryViewTab("leave-records")}
                  className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    historyViewTab === "leave-records"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Leave Records
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryViewTab("monthly-credit")}
                  className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    historyViewTab === "monthly-credit"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Monthly Credit
                </button>
              </div>

              <LeaveHistoryTable
                rows={filteredHistoryRows}
                loading={loading}
                error={error}
                selectable={isDeleteMode}
                selectedIds={selectedHistoryIds}
                onToggleRow={handleToggleHistoryRow}
                onToggleAll={handleToggleAllHistoryRows}
              />
            </div>
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

      <MarkLeaveConfirmationModal
        isOpen={isMarkLeaveConfirmOpen}
        employeeName={leave.fullName}
        action={pendingLeaveStatus ? "mark" : "unmark"}
        isLoading={isLeaveStatusUpdating}
        error={leaveStatusError}
        onConfirm={handleConfirmLeaveStatusChange}
        onClose={handleCloseLeaveStatusConfirm}
      />

      <DeleteEntryConfirmation
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteSelectedEntries}
        isLoading={isDeletingEntries}
        title="Delete selected entries"
        description={`Are you sure you want to delete ${selectedHistoryIds.size} selected entr${
          selectedHistoryIds.size > 1 ? "ies" : "y"
        }? This action cannot be undone.`}
        confirmLabel={`Delete (${selectedHistoryIds.size})`}
        cancelLabel="Cancel"
      />
    </div>
  );
}