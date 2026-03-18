"use client";

import React from "react";

export type ConfirmationAddLeaveValues = {
  period_of_leave: string;
  particulars: string;
  isMonetization: boolean;
  earned_vl: number;
  abs_with_pay_vl: number;
  abs_without_pay_vl: number;
  earned_sl: number;
  abs_with_pay_sl: number;
  abs_without_pay_sl: number;
};

type ConfirmationAddLeaveProps = {
  isOpen: boolean;
  employeeName: string;
  values: ConfirmationAddLeaveValues | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

type LeaveAmountRow = {
  label: string;
  value: number;
};

function renderAmount(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function ConfirmationAddLeave({
  isOpen,
  employeeName,
  values,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationAddLeaveProps) {
  if (!isOpen || !values) {
    return null;
  }

  const vlRows: LeaveAmountRow[] = [
    { label: "Earned VL", value: values.earned_vl },
    { label: "Abs With Pay VL", value: values.abs_with_pay_vl },
    { label: "Abs Without Pay VL", value: values.abs_without_pay_vl },
  ];

  const slRows: LeaveAmountRow[] = [
    { label: "Earned SL", value: values.earned_sl },
    { label: "Abs With Pay SL", value: values.abs_with_pay_sl },
    { label: "Abs Without Pay SL", value: values.abs_without_pay_sl },
  ];

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800">Confirm Leave Entry</h3>
        <p className="mt-1 text-sm text-gray-600">
          Please review the details before adding this leave entry for{" "}
          <span className="font-semibold text-gray-800">{employeeName}</span>.
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Period of Leave
            </p>
            <p className="mt-1 text-sm text-gray-800">
              {values.period_of_leave}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Particulars
            </p>
            <p className="mt-1 text-sm text-gray-800">{values.particulars}</p>
            {values.isMonetization && (
              <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                Monetization
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Vacation Leave (VL)
              </p>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {vlRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span>{row.label}</span>
                    <span className="font-semibold text-gray-800">
                      {renderAmount(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Sick Leave (SL)
              </p>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {slRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span>{row.label}</span>
                    <span className="font-semibold text-gray-800">
                      {renderAmount(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Back
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Confirm Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
