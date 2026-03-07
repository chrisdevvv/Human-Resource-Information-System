"use client";
// Component: ErrorModal
// Filename: ErrorModal.tsx
// Purpose: Generic error modal to display validation or server messages
import React from "react";
import { AlertCircle } from "../../assets/icons";

type Props = {
  error: { title?: string; desc?: string } | null;
  onClose: () => void;
};

export default function ErrorModal({ error, onClose }: Props) {
  if (!error) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      aria-hidden={false}
    >
      <div className="bg-white p-5 rounded-lg max-w-sm w-full shadow-lg border-2 border-blue-600 relative">
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
