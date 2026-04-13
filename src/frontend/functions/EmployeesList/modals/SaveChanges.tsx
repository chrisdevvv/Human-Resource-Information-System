"use client";

import React from "react";

type SaveChangesProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export default function SaveChanges({
  visible,
  onConfirm,
  onCancel,
  isLoading = false,
}: SaveChangesProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-5 shadow-2xl sm:p-6">
        <h3 className="text-lg font-bold text-gray-800">
          Confirm Save Changes
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to save the updated employee details?
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
