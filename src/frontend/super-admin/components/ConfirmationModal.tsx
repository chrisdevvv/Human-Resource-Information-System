"use client";

import React from "react";

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  warningMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
};

export default function ConfirmationModal({
  visible,
  title,
  message,
  warningMessage,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmClassName = "bg-blue-600 hover:bg-blue-700 text-white",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmationModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/45">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">{message}</p>

        {warningMessage && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            {warningMessage}
          </p>
        )}

        {children && <div className="mb-4">{children}</div>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition text-sm font-medium cursor-pointer disabled:opacity-60 ${confirmClassName}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
