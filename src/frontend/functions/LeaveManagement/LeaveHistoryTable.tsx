"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SkeletonSection } from "../../components/Skeleton/SkeletonUtils";
import type { LeaveHistoryRecord } from "./leaveApi";

type LeaveHistoryTableProps = {
  rows: LeaveHistoryRecord[];
  loading?: boolean;
  error?: string | null;
  selectable?: boolean;
  selectedIds?: Set<number>;
  onToggleRow?: (rowId: number) => void;
  onToggleAll?: () => void;
};

const formatNumber = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("en-US", {
    useGrouping: false,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

const formatDateOnly = (dateStr: string): string => {
  if (!dateStr) return "-";

  const dateOnly = dateStr.split("T")[0].split(" ")[0];
  const [year, month, day] = dateOnly.split("-");

  if (!year || !month || !day) return dateOnly || "-";

  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function LeaveHistoryTable({
  rows,
  loading = false,
  error = null,
  selectable = false,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: LeaveHistoryTableProps) {
  const [mobileIndex, setMobileIndex] = useState(0);

  const allSelected =
    selectable &&
    rows.length > 0 &&
    rows.every((row) => selectedIds?.has(row.id));

  useEffect(() => {
    if (rows.length === 0) {
      setMobileIndex(0);
      return;
    }

    setMobileIndex((prev) => {
      if (prev < 0) return 0;
      if (prev > rows.length - 1) return rows.length - 1;
      return prev;
    });
  }, [rows]);

  const mobileRow = useMemo(() => {
    if (rows.length === 0) return null;
    return rows[mobileIndex] ?? rows[0];
  }, [rows, mobileIndex]);

  if (loading) {
    return <SkeletonSection rows={6} columns={6} title={false} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200">
      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden max-h-125 overflow-y-auto md:block">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-blue-100">
            <tr className="text-[10px] uppercase text-gray-700">
              {selectable && (
                <th className="bg-blue-100 px-2 py-2 text-center font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(allSelected)}
                    onChange={() => onToggleAll?.()}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300"
                  />
                </th>
              )}
              <th className="bg-blue-100 px-2 py-2 text-left font-bold">
                Period
              </th>
              <th className="bg-blue-100 px-2 py-2 text-left font-bold">
                Particulars
              </th>
              <th className="bg-blue-100 px-2 py-2 text-right font-bold">
                EVL
              </th>
              <th className="bg-blue-100 px-2 py-2 text-right font-bold">
                AWP VL
              </th>
              <th className="bg-blue-100 px-2 py-2 text-right font-bold">
                AWOP VL
              </th>
              <th className="bg-blue-100 px-2 py-2 text-right font-bold">
                Bal VL
              </th>
              <th className="bg-blue-100 px-2 py-2 text-right font-bold">
                ESL
              </th>
              <th className="bg-blue-100 px-2 py-2 text-right font-bold">
                AWP SL
              </th>
              <th className="bg-blue-100 px-2 py-2 text-right font-bold">
                AWOP SL
              </th>
              <th className="bg-blue-100 px-2 py-2 text-right font-bold">
                Bal SL
              </th>
              <th className="bg-blue-100 px-2 py-2 text-left font-bold">
                Date
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length > 0 ? (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`${i % 2 ? "bg-sky-50" : "bg-white"}`}
                >
                  {selectable && (
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedIds?.has(row.id))}
                        onChange={() => onToggleRow?.(row.id)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-100"
                      />
                    </td>
                  )}

                  <td className="px-2 py-2 font-bold text-gray-900">
                    {row.periodOfLeave}
                  </td>
                  <td className="px-2 py-2 font-bold text-gray-700">
                    {row.particulars || "-"}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-green-700">
                    {formatNumber(row.earnedVl)}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-red-700">
                    {formatNumber(row.absWithPayVl)}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-gray-700">
                    {formatNumber(row.absWithoutPayVl)}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-gray-900">
                    {formatNumber(row.balVl)}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-green-700">
                    {formatNumber(row.earnedSl)}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-red-700">
                    {formatNumber(row.absWithPaySl)}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-gray-700">
                    {formatNumber(row.absWithoutPaySl)}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-gray-900">
                    {formatNumber(row.balSl)}
                  </td>
                  <td className="px-2 py-2 font-bold text-gray-700">
                    {formatDateOnly(row.dateOfAction)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={selectable ? 12 : 11}
                  className="px-3 py-8 text-center font-bold text-gray-500"
                >
                  No leave history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE VIEW (SINGLE CARD WITH NAVIGATION) ================= */}
      <div className="p-3 md:hidden">
        {rows.length === 0 && (
          <div className="py-6 text-center text-sm font-bold text-gray-500">
            No leave history yet.
          </div>
        )}

        {rows.length > 0 && mobileRow && (
          <div className="space-y-3">
            {selectable && (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-xs font-bold text-gray-700">
                  Row {mobileIndex + 1} of {rows.length}
                </span>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <span>Select</span>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedIds?.has(mobileRow.id))}
                    onChange={() => onToggleRow?.(mobileRow.id)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300"
                  />
                </label>
              </div>
            )}

            {!selectable && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs font-bold text-gray-700">
                Row {mobileIndex + 1} of {rows.length}
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-2 text-sm font-bold text-gray-900">
                {mobileRow.periodOfLeave}
              </div>

              <div className="mb-2 text-xs font-bold text-gray-600">
                {mobileRow.particulars || "-"}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-bold text-gray-500">VL Earned</span>
                  <div className="font-bold text-green-600">
                    {formatNumber(mobileRow.earnedVl)}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-500">VL Used</span>
                  <div className="font-bold text-red-600">
                    {formatNumber(mobileRow.absWithPayVl)}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-500">VL Without Pay</span>
                  <div className="font-bold text-gray-700">
                    {formatNumber(mobileRow.absWithoutPayVl)}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-500">VL Balance</span>
                  <div className="font-bold">{formatNumber(mobileRow.balVl)}</div>
                </div>

                <div>
                  <span className="font-bold text-gray-500">SL Earned</span>
                  <div className="font-bold text-green-600">
                    {formatNumber(mobileRow.earnedSl)}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-500">SL Used</span>
                  <div className="font-bold text-red-600">
                    {formatNumber(mobileRow.absWithPaySl)}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-500">SL Without Pay</span>
                  <div className="font-bold text-gray-700">
                    {formatNumber(mobileRow.absWithoutPaySl)}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-500">SL Balance</span>
                  <div className="font-bold">{formatNumber(mobileRow.balSl)}</div>
                </div>
              </div>

              <div className="mt-3 text-xs font-bold text-gray-500">
                {formatDateOnly(mobileRow.dateOfAction)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {mobileIndex === 0 ? (
                <button
                  type="button"
                  onClick={() => setMobileIndex(rows.length - 1)}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700"
                >
                  Jump to Last
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMobileIndex((prev) => Math.max(prev - 1, 0))}
                  className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700"
                >
                  Previous
                </button>
              )}

              {mobileIndex === rows.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setMobileIndex(0)}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700"
                >
                  Back to First
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setMobileIndex((prev) => Math.min(prev + 1, rows.length - 1))
                  }
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                >
                  Next
                </button>
              )}
            </div>

            {selectable && rows.length > 1 && (
              <button
                type="button"
                onClick={() => onToggleAll?.()}
                className="w-full rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700"
              >
                {allSelected ? "Unselect All" : "Select All"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}