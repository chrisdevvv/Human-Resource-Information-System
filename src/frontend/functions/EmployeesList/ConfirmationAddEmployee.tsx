"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

type ConfirmationAddEmployeeProps = {
  isOpen: boolean;
  employeeName?: string;
  onClose: () => void;
};

export default function ConfirmationAddEmployee({
  isOpen,
  employeeName,
  onClose,
}: ConfirmationAddEmployeeProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-7 w-7 text-green-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Employee Added Successfully
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {employeeName
                ? `${employeeName} has been added to the system.`
                : "The employee has been added to the system."}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              This message closes automatically after 3 seconds.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
