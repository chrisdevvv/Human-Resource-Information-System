"use client";

import React from "react";
import type { LeaveHistoryRecord } from "./leaveApi";

type LeaveHistoryTableProps = {
  rows: LeaveHistoryRecord[];
  loading?: boolean;
  error?: string | null;
};

const formatNumber = (value: number) => value.toFixed(2);

const formatDateOnly = (dateStr: string): string => {
  if (!dateStr) return "-";
  const datePart = dateStr.split("T")[0].split(" ")[0];
  if (!datePart) return "-";
  const parts = datePart.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return datePart;
};

export default function LeaveHistoryTable({
  rows,
  loading = false,
  error = null,
}: LeaveHistoryTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">
        Loading leave history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-full border-collapse text-sm">
        <thead className="bg-gray-50">
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-600">
            <th className="px-3 py-2 text-left">Period of Leave</th>
            <th className="px-3 py-2 text-left">Particulars</th>
            <th className="px-3 py-2 text-right">Earned VL</th>
            <th className="px-3 py-2 text-right">Abs With Pay VL</th>
            <th className="px-3 py-2 text-right">Abs Without Pay VL</th>
            <th className="px-3 py-2 text-right">Bal VL</th>
            <th className="px-3 py-2 text-right">Earned SL</th>
            <th className="px-3 py-2 text-right">Abs With Pay SL</th>
            <th className="px-3 py-2 text-right">Abs Without Pay SL</th>
            <th className="px-3 py-2 text-right">Bal SL</th>
            <th className="px-3 py-2 text-left">
              Date and Action Taken / Evaluation
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => {
              const isMonthlyCredit = row.particulars
                .trim()
                .toLowerCase()
                .includes("monthly leave credit");

              return (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 ${
                    isMonthlyCredit ? "bg-emerald-50/40" : "bg-white"
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {row.periodOfLeave}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {row.particulars || "-"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {formatNumber(row.earnedVl)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {formatNumber(row.absWithPayVl)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {formatNumber(row.absWithoutPayVl)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">
                    {formatNumber(row.balVl)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {formatNumber(row.earnedSl)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {formatNumber(row.absWithPaySl)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {formatNumber(row.absWithoutPaySl)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">
                    {formatNumber(row.balSl)}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {formatDateOnly(row.dateOfAction)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={11} className="px-3 py-8 text-center text-gray-500">
                No leave history yet for this employee.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
