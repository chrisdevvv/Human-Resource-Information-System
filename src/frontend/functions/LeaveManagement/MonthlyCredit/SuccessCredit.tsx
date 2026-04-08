"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type SuccessCreditProps = {
  isOpen: boolean;
  variant: "success" | "failed";
  title: string;
  message: string;
  autoCloseDuration?: number;
  onClose: () => void;
};

export default function SuccessCredit({
  isOpen,
  variant,
  title,
  message,
  autoCloseDuration = 2500,
  onClose,
}: SuccessCreditProps) {
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    setVisible(isOpen);

    if (isOpen && autoCloseDuration > 0) {
      const timer = window.setTimeout(() => {
        setVisible(false);
        onClose();
      }, autoCloseDuration);

      return () => window.clearTimeout(timer);
    }
  }, [isOpen, autoCloseDuration, onClose]);

  if (!visible) {
    return null;
  }

  const isSuccess = variant === "success";
  const panelClass = isSuccess
    ? "border-emerald-200 bg-emerald-50"
    : "border-rose-200 bg-rose-50";
  const titleClass = isSuccess ? "text-emerald-900" : "text-rose-900";
  const messageClass = isSuccess ? "text-emerald-800" : "text-rose-800";

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))]">
      <div className={`rounded-xl border p-4 shadow-xl ${panelClass}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {isSuccess ? (
              <CheckCircle2 size={20} className="text-emerald-600" />
            ) : (
              <XCircle size={20} className="text-rose-600" />
            )}
          </div>

          <div className="flex-1">
            <p className={`text-sm font-semibold ${titleClass}`}>{title}</p>
            <p className={`mt-1 text-sm ${messageClass}`}>{message}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 transition hover:text-gray-700"
            aria-label="Close toast"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
