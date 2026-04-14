import React, { useEffect, useState } from "react";
import { Archive, ChevronDown, XCircle } from "lucide-react";
import { createClearHandler } from "../../../utils/clearFormUtils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

type ArchivingReasonOption = {
  id: number;
  reason_name: string;
};

type ArchiveConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string, archiveReason: string) => void;
  isLoading?: boolean;
  error?: string | null;
  employeeName?: string;
};

function ArchiveConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  error,
  employeeName,
}: ArchiveConfirmationModalProps) {
  const [password, setPassword] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [reasonOptions, setReasonOptions] = useState<ArchivingReasonOption[]>(
    [],
  );
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [reasonLoadError, setReasonLoadError] = useState<string | null>(null);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [touched, setTouched] = useState(false);
  const [reasonTouched, setReasonTouched] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadReasons = async () => {
      try {
        setReasonsLoading(true);
        setReasonLoadError(null);

        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No auth token found.");
        }

        const response = await fetch(`${API_BASE_URL}/api/archiving-reasons`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const payload = (await response.json().catch(() => ({}))) as {
          data?: ArchivingReasonOption[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.message || "Failed to load archiving reasons.",
          );
        }

        if (!cancelled) {
          setReasonOptions(Array.isArray(payload.data) ? payload.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setReasonOptions([]);
          setReasonLoadError(
            err instanceof Error ? err.message : "Failed to load reasons.",
          );
        }
      } finally {
        if (!cancelled) {
          setReasonsLoading(false);
        }
      }
    };

    void loadReasons();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setReasonTouched(true);
    if (!password || !archiveReason.trim()) return;
    onConfirm(password, archiveReason.trim());
    setPassword("");
    setArchiveReason("");
    setTouched(false);
    setReasonTouched(false);
    setHasChanges(false);
  };

  const handleClose = () => {
    setPassword("");
    setArchiveReason("");
    setShowReasonDropdown(false);
    setTouched(false);
    setReasonTouched(false);
    setHasChanges(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          Deactivate Employee
        </h2>
        <p className="text-gray-700 mb-4">
          Are you sure you want to deactivate
          {employeeName ? (
            <span className="font-semibold"> {employeeName}</span>
          ) : (
            " this employee"
          )}
          ? This action requires your password and a reason to confirm.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setHasChanges(true);
              }}
              onBlur={() => setTouched(true)}
              className="text-black w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {touched && !password && (
              <p className="text-xs text-red-500 mt-1">Password is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for deactivating
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setReasonTouched(true);
                  setShowReasonDropdown((current) => !current);
                }}
                onBlur={() => {
                  setTimeout(() => setShowReasonDropdown(false), 150);
                }}
                disabled={isLoading || reasonsLoading}
                className="text-black w-full rounded border border-gray-300 px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-between gap-3"
              >
                <span
                  className={archiveReason ? "text-gray-900" : "text-gray-500"}
                >
                  {archiveReason ||
                    (reasonsLoading ? "Loading reasons..." : "Select a reason")}
                </span>
                <ChevronDown size={16} className="text-gray-500 shrink-0" />
              </button>

              {showReasonDropdown && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-blue-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                  {reasonsLoading ? (
                    <div className="px-3 py-2 text-center text-sm text-gray-500">
                      Loading archiving reasons...
                    </div>
                  ) : reasonOptions.length === 0 ? (
                    <div className="px-3 py-2 text-center text-sm text-gray-500">
                      No archiving reasons available
                    </div>
                  ) : (
                    reasonOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setArchiveReason(option.reason_name);
                          setReasonTouched(true);
                          setHasChanges(true);
                          setShowReasonDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition hover:bg-blue-50 ${
                          archiveReason === option.reason_name
                            ? "bg-blue-100 font-medium text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {option.reason_name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {reasonTouched && !archiveReason.trim() && (
              <p className="text-xs text-red-500 mt-1">
                Deactivation reason is required.
              </p>
            )}
            {reasonLoadError && (
              <p className="text-xs text-red-500 mt-1">{reasonLoadError}</p>
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center justify-end gap-2 mt-4">
            {hasChanges && (
              <button
                type="button"
                onClick={createClearHandler(() => {
                  setPassword("");
                  setArchiveReason("");
                  setTouched(false);
                  setReasonTouched(false);
                  setHasChanges(false);
                }, hasChanges)}
                disabled={isLoading}
                className="mr-auto cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-60 disabled:no-underline"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="cursor-pointer rounded px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1">
                <XCircle size={14} />
                Cancel
              </span>
            </button>
            <button
              type="submit"
              disabled={isLoading || !password || !archiveReason.trim()}
              className="cursor-pointer rounded px-3 py-1.5 text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1">
                <Archive size={14} />
                {isLoading ? "Deactivating..." : "Confirm Deactivate"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArchiveConfirmationModal;
