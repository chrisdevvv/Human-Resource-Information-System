"use client";

import React, { useMemo, useState } from "react";
import ConfirmationCredit from "./ConfirmationCredit";
import SuccessCredit from "./SuccessCredit";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

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

type ToastState = {
  variant: "success" | "failed";
  title: string;
  message: string;
};

type ActionType = "apply" | "delete" | null;

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

export default function MonthlyCredit() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const requestBody = { year, month };

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("authToken") || "";
  };

  const simulate = async () => {
    setLoading(true);
    setError("");

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

  const openToast = (state: ToastState) => {
    setToast(state);
  };

  const runApplyMonthlyCredit = async () => {
    setLoading(true);
    setError("");

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

      const result = data as ApplyResponse;
      openToast({
        variant: "success",
        title: "Monthly credit applied",
        message: `${result.message} Credited: ${result.credited}, Skipped: ${result.skipped}.`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Monthly credit apply failed";
      openToast({
        variant: "failed",
        title: "Apply failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const runDeleteAppliedMonthlyCredit = async () => {
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

      const result = data as DeleteResponse;
      openToast({
        variant: "success",
        title: "Applied credit deleted",
        message: `${result.message} Deleted entries: ${result.deleted_entries}, Affected employees: ${result.affected_employees}.`,
      });
      await simulate();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Delete monthly credit failed";
      openToast({
        variant: "failed",
        title: "Delete failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    const action = activeAction;
    setActiveAction(null);

    if (action === "apply") {
      await runApplyMonthlyCredit();
      return;
    }

    if (action === "delete") {
      await runDeleteAppliedMonthlyCredit();
    }
  };

  const handleOpenAction = (action: ActionType) => {
    setActiveAction(action);
  };

  return (
    <div className="w-full max-w-7xl mx-auto rounded-xl border border-gray-200 bg-white p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">
          Monthly Credit Simulation
        </h2>
        <p className="text-xs text-gray-600">
          Simulate and apply 1.25 leave credit for non-teaching employees.
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Teaching employees are excluded from monthly credit and will be
          skipped.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-700">Year</span>
          <input
            type="number"
            min={1900}
            max={3000}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 sm:text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-700">Month</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 sm:text-sm"
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-end sm:flex-wrap">
          <button
            type="button"
            onClick={simulate}
            disabled={loading}
            className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
          >
            {loading ? "Processing..." : "Simulate"}
          </button>

          <button
            type="button"
            onClick={() => handleOpenAction("apply")}
            disabled={loading || !simulationResult}
            className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
          >
            Apply Real Credit
          </button>

          <button
            type="button"
            onClick={() => handleOpenAction("delete")}
            disabled={loading || !simulationResult}
            className="cursor-pointer rounded-md bg-rose-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
          >
            Delete Applied Credit
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {simulationResult ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
              <p className="text-xs text-gray-500">Period</p>
              <p className="text-sm font-semibold text-gray-900">
                {simulationResult.period}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
              <p className="text-xs text-emerald-700">Would Credit</p>
              <p className="text-sm font-semibold text-emerald-900">
                {simulationResult.would_credit}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <p className="text-xs text-amber-700">Would Skip</p>
              <p className="text-sm font-semibold text-amber-900">
                {simulationResult.would_skip}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-800">
                Employees To Credit
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-1 text-left text-xs">Employee</th>
                      <th className="px-3 py-1 text-left text-xs">
                        Projected VL
                      </th>
                      <th className="px-3 py-1 text-left text-xs">
                        Projected SL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(simulationResult.would_credit_employees || []).map(
                      (row, index) => {
                        const rowBackgroundClass =
                          index % 2 === 0 ? "bg-gray-100" : "bg-white";

                        return (
                          <tr
                            key={row.employee_id}
                            className={`border-t border-gray-100 ${rowBackgroundClass}`}
                          >
                            <td className="px-3 py-1 text-xs text-gray-800">
                              {row.employee_name}
                            </td>
                            <td className="px-3 py-1 text-xs text-gray-700">
                              {row.projected_balance?.bal_vl ?? "-"}
                            </td>
                            <td className="px-3 py-1 text-xs text-gray-700">
                              {row.projected_balance?.bal_sl ?? "-"}
                            </td>
                          </tr>
                        );
                      },
                    )}
                    {(simulationResult.would_credit_employees || []).length ===
                    0 ? (
                      <tr>
                        <td
                          className="px-3 py-2 text-xs text-gray-500"
                          colSpan={3}
                        >
                          No employees will be credited.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-800">
                Employees To Skip
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-1 text-left text-xs">Employee</th>
                      <th className="px-3 py-1 text-left text-xs">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(simulationResult.would_skip_employees || []).map(
                      (row, index) => {
                        const rowBackgroundClass =
                          index % 2 === 0 ? "bg-gray-100" : "bg-white";

                        return (
                          <tr
                            key={`${row.employee_id}-${row.reason}`}
                            className={`border-t border-gray-100 ${rowBackgroundClass}`}
                          >
                            <td className="px-3 py-1 text-xs text-gray-800">
                              {row.employee_name}
                            </td>
                            <td className="px-3 py-1 text-xs text-gray-700">
                              {reasonLabel(row.reason)}
                            </td>
                          </tr>
                        );
                      },
                    )}
                    {(simulationResult.would_skip_employees || []).length ===
                    0 ? (
                      <tr>
                        <td
                          className="px-3 py-2 text-xs text-gray-500"
                          colSpan={2}
                        >
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

      <ConfirmationCredit
        isOpen={activeAction !== null}
        title={
          activeAction === "apply"
            ? "Apply real monthly credit?"
            : "Delete applied monthly credit?"
        }
        message={
          activeAction === "apply"
            ? "This will apply the credit for the selected month and update balances."
            : "This will delete the applied credit for the selected month and recompute affected balances."
        }
        confirmLabel={
          activeAction === "apply" ? "Apply Credit" : "Delete Credit"
        }
        confirmVariant={activeAction === "delete" ? "rose" : "blue"}
        isLoading={loading}
        onClose={() => setActiveAction(null)}
        onConfirm={handleConfirmAction}
      />

      <SuccessCredit
        isOpen={Boolean(toast)}
        variant={toast?.variant ?? "success"}
        title={toast?.title ?? ""}
        message={toast?.message ?? ""}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
