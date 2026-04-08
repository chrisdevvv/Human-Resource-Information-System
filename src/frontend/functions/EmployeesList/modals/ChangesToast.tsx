"use client";

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type ChangesToastProps = {
  message: string;
  type: "success" | "error";
};

export default function ChangesToast({ message, type }: ChangesToastProps) {
  const isSuccess = type === "success";

  return (
    <div
      className={`pointer-events-none fixed right-4 top-4 z-60 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      role="status"
      aria-live="polite"
    >
      {isSuccess ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      <span>{message}</span>
    </div>
  );
}
