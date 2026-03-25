import React, { useState } from "react";

type ArchiveConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  employeeName?: string;
};

function ArchiveConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  error,
  success = false,
  employeeName,
}: ArchiveConfirmationModalProps) {
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!password) return;
    onConfirm(password);
  };

  if (!isOpen) return null;

  // Show success message
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
        <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Archive Successful
            </h2>
            <p className="text-gray-700 mb-6">
              {employeeName ? (
                <>
                  <span className="font-semibold">{employeeName}</span> has been
                  archived successfully.
                </>
              ) : (
                "The employee has been archived successfully."
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          ? This action requires your password to confirm.
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
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer rounded px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !password}
              className="cursor-pointer rounded px-4 py-2 text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-60"
            >
              {isLoading ? "Archiving..." : "Confirm Archive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArchiveConfirmationModal;
