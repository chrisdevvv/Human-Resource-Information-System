"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  registerClearFormConfirmation,
  type ClearFormDialogRequest,
} from "../utils/clearFormUtils";

type DialogState = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
};

const DEFAULT_TITLE = "Clear All Fields";
const DEFAULT_MESSAGE =
  "You have unsaved changes. Are you sure you want to clear all fields?";

/**
 * Global host for Clear All confirmation dialogs.
 * Mount once in app layout so all form clear handlers can reuse it.
 */
export default function ClearAllConfirmation() {
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    title: DEFAULT_TITLE,
    message: DEFAULT_MESSAGE,
    confirmText: "Clear All",
    cancelText: "Cancel",
  });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    registerClearFormConfirmation((request: ClearFormDialogRequest) => {
      setDialog({
        open: true,
        title: request.title || DEFAULT_TITLE,
        message: request.message || DEFAULT_MESSAGE,
        confirmText: request.confirmText || "Clear All",
        cancelText: request.cancelText || "Cancel",
      });

      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    });

    return () => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
      registerClearFormConfirmation(null);
    };
  }, []);

  const closeWith = (value: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setDialog((prev) => ({ ...prev, open: false }));
    if (resolver) {
      resolver(value);
    }
  };

  if (!dialog.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-50 p-2 text-red-600">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">
              {dialog.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{dialog.message}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => closeWith(false)}
            className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
          >
            {dialog.cancelText}
          </button>
          <button
            type="button"
            onClick={() => closeWith(true)}
            className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
