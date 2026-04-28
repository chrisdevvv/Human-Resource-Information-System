"use client";

import React, { useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type SimEmployeeCredit = {
  employee_id: number;
  employee_name: string;
  projected_balance?: {
    bal_vl: number;
    bal_sl: number;
  };
};

type SimEmployeeSkip = {
  employee_id: number;
  employee_name: string;
  reason: string;
};

type SimulationResponse = {
  message: string;
  period: string;
  would_credit: number;
  would_skip: number;
  would_credit_employees?: SimEmployeeCredit[];
  would_skip_employees?: SimEmployeeSkip[];
};

type ApplyResponse = {
  message: string;
  period: string;
  credited: number;
  skipped: number;
};

type DeleteResponse = {
  message: string;
  period: string;
  deleted_entries: number;
  affected_employees: number;
};

const reasonLabel = (reason: string) => {
  switch (reason) {
    case "ON_LEAVE_DURING_PERIOD":
      return "On leave during selected period";
    case "ALREADY_CREDITED_FOR_PERIOD":
      return "Already credited for selected month";
    case "NOT_ELIGIBLE_FOR_MONTHLY_CREDIT":
      return "Not eligible for monthly credit";
    case "TEACHING_EMPLOYEE":
      return "Teaching employees are excluded from monthly credit";
    default:
      return reason;
  }
};

const sanitizeDisplayName = (name: string) =>
  String(name || "")
    .replace(/\bN\/A\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function MonthlyCreditSimulation() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResponse | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyResponse | null>(null);
  const [deleteResult, setDeleteResult] = useState<DeleteResponse | null>(null);
  const [error, setError] = useState<string>("");

  const requestBody = { year, month };

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("authToken") || "";
  };

  const simulate = async () => {
    setLoading(true);
    setError("");
    setApplyResult(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Missing auth token. Please login again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/leave/credit-monthly/simulate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      const data = (await response.json().catch(() => ({}))) as
        | SimulationResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error(data?.message || "Simulation failed");
      }

      setSimulationResult(data as SimulationResponse);
    } catch (err) {
      setSimulationResult(null);
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const applyMonthlyCredit = async () => {
    setLoading(true);
    setError("");
    setDeleteResult(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Missing auth token. Please login again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/leave/credit-monthly`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json().catch(() => ({}))) as
        | ApplyResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error(data?.message || "Monthly credit apply failed");
      }

      setApplyResult(data as ApplyResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Monthly credit apply failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteAppliedMonthlyCredit = async () => {
    const proceed = window.confirm(
      "Delete applied monthly credit for this period? This will recompute affected balances.",
    );

    if (!proceed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Missing auth token. Please login again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/leave/credit-monthly/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      const data = (await response.json().catch(() => ({}))) as
        | DeleteResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error(data?.message || "Delete monthly credit failed");
      }

      setDeleteResult(data as DeleteResponse);
      setApplyResult(null);
      await simulate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Delete monthly credit failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto rounded-xl border border-gray-200 bg-white p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
          Monthly Credit Simulation
        </h2>
        <p className="text-sm text-gray-600">
          Simulate and apply 1.25 leave credit for non-teaching employees.
        </p>
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Teaching employees are excluded from monthly credit and will be
          skipped.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Year</span>
          <input
            type="number"
            min={1900}
            max={3000}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Month</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 flex items-end gap-2">
          <button
            type="button"
            onClick={simulate}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Processing..." : "Simulate"}
          </button>

          <button
            type="button"
            onClick={applyMonthlyCredit}
            disabled={loading || !simulationResult}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Apply Real Credit
          </button>

          <button
            type="button"
            onClick={deleteAppliedMonthlyCredit}
            disabled={loading || !simulationResult}
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            Delete Applied Credit
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {simulationResult ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Period</p>
              <p className="text-base font-semibold text-gray-900">
                {simulationResult.period}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Would Credit</p>
              <p className="text-base font-semibold text-emerald-900">
                {simulationResult.would_credit}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">Would Skip</p>
              <p className="text-base font-semibold text-amber-900">
                {simulationResult.would_skip}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800">
                Employees To Credit
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Employee</th>
                      <th className="px-3 py-2 text-left">Projected VL</th>
                      <th className="px-3 py-2 text-left">Projected SL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(simulationResult.would_credit_employees || []).map(
                      (row) => (
                        <tr
                          key={row.employee_id}
                          className="border-t border-gray-100"
                        >
                          <td className="px-3 py-2 text-gray-900 font-medium">
                            {sanitizeDisplayName(row.employee_name)}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {row.projected_balance?.bal_vl ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {row.projected_balance?.bal_sl ?? "-"}
                          </td>
                        </tr>
                      ),
                    )}
                    {(simulationResult.would_credit_employees || []).length ===
                    0 ? (
                      <tr>
                        <td className="px-3 py-3 text-gray-500" colSpan={3}>
                          No employees will be credited.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800">
                Employees To Skip
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Employee</th>
                      <th className="px-3 py-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(simulationResult.would_skip_employees || []).map(
                      (row) => (
                        <tr
                          key={`${row.employee_id}-${row.reason}`}
                          className="border-t border-gray-100"
                        >
                          <td className="px-3 py-2 text-gray-900 font-medium">
                            {sanitizeDisplayName(row.employee_name)}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {reasonLabel(row.reason)}
                          </td>
                        </tr>
                      ),
                    )}
                    {(simulationResult.would_skip_employees || []).length ===
                    0 ? (
                      <tr>
                        <td className="px-3 py-3 text-gray-500" colSpan={2}>
                          No employees will be skipped.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {applyResult ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {applyResult.message} Credited: {applyResult.credited}, Skipped:{" "}
          {applyResult.skipped}.
        </div>
      ) : null}

      {deleteResult ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {deleteResult.message} Deleted entries: {deleteResult.deleted_entries}
          , Affected employees: {deleteResult.affected_employees}.
        </div>
      ) : null}
    </div>
  );
}
