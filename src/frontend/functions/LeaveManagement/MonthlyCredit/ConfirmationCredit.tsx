"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Trash2, X } from "lucide-react";

type ConfirmationCreditProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "blue" | "rose";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmationCredit({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "blue",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmationCreditProps) {
  if (!isOpen) {
    return null;
  }

  const confirmButtonClass =
    confirmVariant === "rose"
      ? "bg-rose-600 hover:bg-rose-700"
      : "bg-blue-600 hover:bg-blue-700";

  const Icon = confirmVariant === "rose" ? Trash2 : CheckCircle2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                confirmVariant === "rose" ? "bg-rose-100" : "bg-blue-100"
              }`}
            >
              {confirmVariant === "rose" ? (
                <AlertTriangle
                  size={20}
                  className="text-rose-600"
                  strokeWidth={2.2}
                />
              ) : (
                <Icon size={20} className="text-blue-600" strokeWidth={2.2} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{message}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close confirmation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClass}`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
