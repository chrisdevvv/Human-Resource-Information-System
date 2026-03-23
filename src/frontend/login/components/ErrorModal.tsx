"use client";
// Component: ErrorModal
// Filename: ErrorModal.tsx
// Purpose: Generic error modal to display validation or server messages
import React, { useEffect } from "react";
import { AlertCircle } from "../../assets/icons";

type Props = {
  error: { title?: string; desc?: string } | null;
  onClose: () => void;
};

export default function ErrorModal({ error, onClose }: Props) {
  useEffect(() => {
    if (!error) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [error]);

  if (!error) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      aria-hidden={false}
    >
      <div className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg border-2 border-blue-600 bg-white p-5 shadow-lg">
        <div style={{ textAlign: "center", padding: "8px 6px" }}>
          <div
            style={{ fontSize: 40, color: "var(--primary)", marginBottom: 8 }}
          >
            <AlertCircle size={40} />
          </div>
          <h3 id="errorTitle" className="text-lg font-semibold">
            {error.title || "Error"}
          </h3>
          <p id="errorDesc" className="text-red-500 mt-1">
            {error.desc || "An error occurred."}
          </p>
          <div className="mt-4">
            <button
              id="errorOk"
              className="transition hover:cursor-pointer px-4 py-2 hover:bg-blue-700 bg-blue-600 text-white rounded-md"
              onClick={onClose}
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
