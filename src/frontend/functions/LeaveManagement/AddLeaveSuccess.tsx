"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

export type AddLeaveSuccessValues = {
  employeeName: string;
  period_of_leave: string;
  particulars: string;
  isMonetization?: boolean;
};

type AddLeaveSuccessProps = {
  isOpen: boolean;
  values: AddLeaveSuccessValues | null;
  onClose: () => void;
  autoCloseDuration?: number;
};

export default function AddLeaveSuccess({
  isOpen,
  values,
  onClose,
  autoCloseDuration = 2000,
}: AddLeaveSuccessProps) {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);

    if (isOpen && autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDuration, onClose]);

  if (!isVisible || !values) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* Header with icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="shrink-0">
            <CheckCircle
              size={32}
              className="text-green-600"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            Leave Added Successfully
          </h3>
        </div>

        {/* Success message */}
        <p className="text-sm text-gray-600 mb-6">
          The leave entry for{" "}
          <span className="font-semibold text-gray-800">
            {values.employeeName}
          </span>{" "}
          has been successfully added to the system.
        </p>

        {/* Details */}
        <div className="space-y-3 mb-6 rounded-lg bg-gray-50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Period of Leave
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {values.period_of_leave}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Particulars
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">
                {values.particulars}
              </p>
              {values.isMonetization && (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  Monetization
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
