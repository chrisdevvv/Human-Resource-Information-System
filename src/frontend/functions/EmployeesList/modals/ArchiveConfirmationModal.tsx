import React, { useState } from "react";
import { Archive, XCircle } from "lucide-react";

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
  const [touched, setTouched] = useState(false);
  const [reasonTouched, setReasonTouched] = useState(false);

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
  };

  const handleClose = () => {
    setPassword("");
    setArchiveReason("");
    setTouched(false);
    setReasonTouched(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          Archive Employee
        </h2>
        <p className="text-gray-700 mb-4">
          Are you sure you want to archive
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
              onChange={(e) => setPassword(e.target.value)}
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
              Reason for archiving
            </label>
            <textarea
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              onBlur={() => setReasonTouched(true)}
              className="text-black w-full min-h-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the reason for archiving"
              disabled={isLoading}
            />
            {reasonTouched && !archiveReason.trim() && (
              <p className="text-xs text-red-500 mt-1">
                Archive reason is required.
              </p>
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
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
                {isLoading ? "Archiving..." : "Confirm Archive"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArchiveConfirmationModal;
