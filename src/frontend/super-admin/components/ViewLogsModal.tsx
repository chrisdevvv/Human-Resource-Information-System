"use client";

import React from "react";
import { XCircle } from "lucide-react";

export type ViewLogDetails = {
  name: string;
  role: string;
  email: string;
  school: string;
  dateTime: string;
  actionTaken: string;
};

type ViewLogsModalProps = {
  visible: boolean;
  log: ViewLogDetails | null;
  onClose: () => void;
};

export default function ViewLogsModal({
  visible,
  log,
  onClose,
}: ViewLogsModalProps) {
  if (!visible || !log) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/45 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-blue-200 shadow-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Log Details</h3>
            <p className="text-sm text-gray-500">
              View activity log information
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
              Name
            </p>
            <p className="text-sm font-semibold text-gray-800">{log.name}</p>
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
              Role
            </p>
            <p className="text-sm font-semibold text-gray-800">{log.role}</p>
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
              Email
            </p>
            <p className="text-sm font-semibold text-gray-800 break-all">
              {log.email}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
              School
            </p>
            <p className="text-sm font-semibold text-gray-800">{log.school}</p>
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
              Date and Time
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {log.dateTime}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-blue-600 mb-1">
              Action Taken
            </p>
            <p className="text-sm font-semibold text-blue-800 leading-relaxed">
              {log.actionTaken}
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium cursor-pointer"
          >
            <span className="inline-flex items-center gap-1">
              <XCircle size={14} />
              Close
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
