"use client";

import React from "react";
import { X } from "lucide-react";

export type RegistrationDetail = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  requested_role: string;
  status: string;
  created_at: string;
};

type Props = {
  account: RegistrationDetail;
  onClose: () => void;
};

export default function UserRolesDetailsModal({ account, onClose }: Props) {
  const formattedDate = new Date(account.created_at).toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusColor =
    account.status === "PENDING"
      ? "bg-yellow-100 text-yellow-800"
      : account.status === "APPROVED"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-5">
          Registration Details
        </h2>

        <div className="space-y-3">
          <Row label="Full Name" value={`${account.firstName} ${account.lastName}`} />
          <Row label="Email" value={account.email} />
          <Row label="School" value={account.school} />
          <Row
            label="Requested Role"
            value={account.requested_role || "Not specified"}
          />
          <Row label="Date Registered" value={formattedDate} />
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-500">Status</span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}
            >
              {account.status}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-500 shrink-0 mr-4">
        {label}
      </span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  );
}
