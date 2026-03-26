"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, RefreshCcw, Trash2, X } from "lucide-react";
import ArchiveConfirmationModal from "./ArchiveConfirmationModal";
import DeleteEntryConfirmation from "./DeleteEntryConfirmation";
import MarkLeaveConfirmationModal from "./MarkLeaveConfirmationModal";
import ArchiveSuccessMessage from "../ArchiveSuccessMessage";
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
  archiveEmployee,
} from "../leaveApi";

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
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [showArchiveSuccess, setShowArchiveSuccess] = useState(false);
  const [isMarkedOnLeave, setIsMarkedOnLeave] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [isLeaveStatusLoading, setIsLeaveStatusLoading] = useState(false);
  const [isLeaveStatusUpdating, setIsLeaveStatusUpdating] = useState(false);
  const [leaveStatusError, setLeaveStatusError] = useState<string | null>(null);
  const [isMarkLeaveConfirmOpen, setIsMarkLeaveConfirmOpen] = useState(false);
  const [pendingLeaveStatus, setPendingLeaveStatus] = useState<boolean | null>(
    null,
  );

  // Added missing state and refs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pdfCooldownRemaining, setPdfCooldownRemaining] = useState(0);
  const pdfCooldownIntervalRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const handleArchive = async (password: string) => {
    setIsArchiving(true);
    setArchiveError(null);
    try {
      if (!employeeId) {
        throw new Error("Employee ID not found");
      }
      await archiveEmployee(employeeId, password);
      setIsArchiveOpen(false);
      setShowArchiveSuccess(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to archive employee. Please try again.";
      setArchiveError(errorMessage);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveSuccessClose = () => {
    setShowArchiveSuccess(false);
    onClose();
  };
  const employeeId = leave?.employeeId ?? leave?.id ?? null;
  const employeeType = leave?.employeeType ?? "non-teaching";
  const [activeTab, setActiveTab] = useState<"history" | "card">("history");
  const [historyRows, setHistoryRows] = useState<LeaveHistoryRecord[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<number>>(
    new Set(),
  );
  const [isDeletingEntries, setIsDeletingEntries] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const employeeTypeLabel =
    employeeType === "non-teaching" ? "Non-Teaching" : "Teaching";

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
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/api/employees/${employeeId}`,
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}${endpoint}`,
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
    // Prevent immediate visual toggle; wait for confirmation modal.
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
    setIsDeleteMode(false);
    setSelectedHistoryIds(new Set());
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

  const handleOpenHistoryInNewTab = () => {
    window.open(`/leave-history/${employeeId}`, "_blank");
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
    const allRowIds = historyRows.map((row) => row.id);
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
    // Open confirmation modal instead of using window.confirm
    setIsDeleteConfirmOpen(true);
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
              <p className="text-sm text-gray-500">Email: {employeeEmail}</p>
              <p className="text-sm text-gray-500">
                Employee Type: {employeeTypeLabel}
              </p>
              <div className="mt-3 flex items-start gap-3">
                <input
                  id="mark-on-leave"
                  type="checkbox"
                  checked={isMarkedOnLeave}
                  onClick={handleLeaveStatusToggle}
                  onChange={() => {
                    // Controlled via confirmation modal flow.
                  }}
                  disabled={isLeaveStatusLoading || isLeaveStatusUpdating}
                  className="mt-1 h-7 w-7 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <div>
                  <label
                    htmlFor="mark-on-leave"
                    onClick={(event) => {
                      event.preventDefault();
                      requestLeaveStatusChange();
                    }}
                    className="cursor-pointer text-lg font-bold text-gray-700"
                  >
                    Mark as on leave
                  </label>
                  <p className="mt-1 text-base text-gray-700">
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
                    <p className="text-sm text-red-500">{leaveStatusError}</p>
                  )}
                </div>
              </div>
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
            <button
              type="button"
              onClick={handleOpenHistoryInNewTab}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              Open in Another Tab
            </button>
            <button
              type="button"
              onClick={handleDeleteSelectedEntries}
              disabled={activeTab !== "history" || isDeletingEntries}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={14} />
              {isDeleteMode
                ? `Delete Entry (${selectedHistoryIds.size})`
                : "Delete Entry"}
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
              <button
                type="button"
                onClick={() => setIsArchiveOpen(true)}
                disabled={isSaving || isArchiving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Archive
              </button>
              <ArchiveConfirmationModal
                isOpen={isArchiveOpen}
                onClose={() => setIsArchiveOpen(false)}
                onConfirm={handleArchive}
                isLoading={isArchiving}
                error={archiveError}
                employeeName={leave.fullName}
              />
              <ArchiveSuccessMessage
                isVisible={showArchiveSuccess}
                employeeName={leave.fullName}
                onClose={handleArchiveSuccessClose}
                autoCloseDuration={2000}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6">
          {activeTab === "history" ? (
            <LeaveHistoryTable
              rows={historyRows}
              loading={loading}
              error={error}
              selectable={isDeleteMode}
              selectedIds={selectedHistoryIds}
              onToggleRow={handleToggleHistoryRow}
              onToggleAll={handleToggleAllHistoryRows}
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
