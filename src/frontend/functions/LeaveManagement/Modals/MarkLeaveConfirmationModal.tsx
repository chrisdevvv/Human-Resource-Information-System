import React from "react";
import { Check, XCircle } from "lucide-react";

type MarkLeaveConfirmationModalProps = {
  isOpen: boolean;
  employeeName?: string;
  action: "mark" | "unmark";
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export default function MarkLeaveConfirmationModal({
  isOpen,
  employeeName,
  action,
  isLoading = false,
  error,
  onConfirm,
  onClose,
}: MarkLeaveConfirmationModalProps) {
  if (!isOpen) return null;

  const isMarkAction = action === "mark";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 px-3 sm:px-4"
      style={{ zIndex: 9999 }}
    >
      <div className="relative w-full max-w-md rounded-xl border border-blue-200 bg-white p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-bold text-gray-800">
          {isMarkAction ? "Mark Employee On Leave" : "Unmark Employee On Leave"}
        </h2>

        <p className="mb-4 text-gray-700">
          Are you sure you want to
          {isMarkAction ? " mark " : " unmark "}
          {employeeName ? (
            <span className="font-semibold">{employeeName}</span>
          ) : (
            "this employee"
          )}
          {isMarkAction ? " as on leave?" : " as available?"}
        </p>

        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <XCircle size={14} />
              Cancel
            </span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <Check size={14} />
              {isLoading ? "Processing..." : "Yes"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
