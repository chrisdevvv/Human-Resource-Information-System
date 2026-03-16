"use client";

import React from "react";
import type { LeaveModalRecord } from "./leaveTypes";

type EditLeaveModalProps = {
  isOpen: boolean;
  leave: LeaveModalRecord | null;
  onClose: () => void;
};

export default function EditLeaveModal({
  isOpen,
  leave,
  onClose,
}: EditLeaveModalProps) {
  if (!isOpen || !leave) {
    return null;
  }

  const employeeTypeLabel =
    leave.employeeType === "non-teaching" ? "Non-Teaching" : "Teaching";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
        <h2 className="text-xl font-bold text-gray-800">Edit Leave</h2>
        <p className="text-sm text-gray-500 mt-1">Employee: {leave.fullName}</p>
        <p className="text-sm text-gray-500">
          Employee Type: {employeeTypeLabel}
        </p>

        <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            Modal content to be added next.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
