"use client";

import React, { useMemo, useState } from "react";
import ConfirmationCredit from "./ConfirmationCredit";
import SuccessCredit from "./SuccessCredit";
import {
  SkeletonBlock,
  SkeletonButton,
  SkeletonFormField,
  SkeletonLine,
  SkeletonTableRow,
} from "../../../components/Skeleton/SkeletonUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type SimEmployeeCredit = {
  employee_id: number;
  employee_name: string;
  on_leave?: boolean;
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
    case "NOT_NON_TEACHING_EMPLOYEE":
      return "Teaching employees are excluded from monthly credit";
    default:
      return reason;
  }
};

const isTeachingRelatedReason = (reason: string) => {
  const normalized = String(reason || "")
    .trim()
    .toLowerCase();

  return (
    normalized === "teaching_employee" ||
    normalized === "not_non_teaching_employee" ||
    normalized.includes("teaching")
  );
};

const isOnLeaveReason = (reason: string) => {
  const normalized = String(reason || "")
    .trim()
    .toLowerCase();

  return (
    normalized === "on_leave_during_period" || normalized.includes("on leave")
  );
};

const sanitizeDisplayName = (name: string) =>
  String(name || "")
    .replace(/\bN\/A\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

function MonthlyCreditSkeleton() {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="space-y-2">
        <SkeletonLine width="w-56" height="h-6" />
        <SkeletonLine width="w-80" height="h-3" />
        <SkeletonBlock width="w-full" height="h-10" rounded="rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        <SkeletonFormField />
        <SkeletonFormField />
        <div className="md:col-span-2 grid grid-cols-2 gap-2 sm:flex sm:items-end sm:flex-wrap">
          <SkeletonButton width="w-full sm:w-24" />
          <SkeletonButton width="w-full sm:w-32" />
          <SkeletonButton width="w-full sm:w-36" className="col-span-2 sm:col-span-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SkeletonBlock width="w-full" height="h-20" rounded="rounded-lg" />
        <SkeletonBlock width="w-full" height="h-20" rounded="rounded-lg" />
        <SkeletonBlock width="w-full" height="h-20" rounded="rounded-lg" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-3 py-3 space-y-3">
            <SkeletonLine width="w-32" height="h-4" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <SkeletonBlock width="w-full" height="h-10" rounded="rounded-md" />
              <SkeletonBlock width="w-full" height="h-10" rounded="rounded-md" />
              <SkeletonBlock width="w-full" height="h-10" rounded="rounded-md" />
            </div>
          </div>

          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <SkeletonLine width="w-20" height="h-3" />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SkeletonLine width="w-24" height="h-3" />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SkeletonLine width="w-24" height="h-3" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonTableRow
                    key={index}
                    columns={3}
                    colWidths={["w-36", "w-16", "w-16"]}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 p-2 sm:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 space-y-2"
              >
                <SkeletonLine width="w-40" height="h-4" />
                <div className="grid grid-cols-2 gap-2">
                  <SkeletonLine width="w-16" height="h-3" />
                  <SkeletonLine width="w-16" height="h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-3 py-3 space-y-3">
            <SkeletonLine width="w-32" height="h-4" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <SkeletonBlock width="w-full" height="h-10" rounded="rounded-md" />
              <SkeletonBlock width="w-full" height="h-10" rounded="rounded-md" />
              <SkeletonBlock width="w-full" height="h-10" rounded="rounded-md" />
            </div>
          </div>

          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <SkeletonLine width="w-20" height="h-3" />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SkeletonLine width="w-24" height="h-3" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonTableRow
                    key={index}
                    columns={2}
                    colWidths={["w-36", "w-full"]}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 p-2 sm:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 space-y-2"
              >
                <SkeletonLine width="w-40" height="h-4" />
                <SkeletonLine width="w-full" height="h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MonthlyCredit() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);

  const [creditSearch, setCreditSearch] = useState("");
  const [creditSortOrder, setCreditSortOrder] = useState<"az" | "za">("az");
  const [creditTypeFilter, setCreditTypeFilter] = useState<
    "all" | "non-teaching" | "not-on-leave"
  >("all");

  const [skipSearch, setSkipSearch] = useState("");
  const [skipSortOrder, setSkipSortOrder] = useState<"az" | "za">("az");
  const [skipTypeFilter, setSkipTypeFilter] = useState<
    "all" | "teaching" | "non-teaching" | "teaching-related" | "on-leave"
  >("all");

  const [loading, setLoading] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResponse | null>(null);
  const [error, setError] = useState("");
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const requestBody = { year, month };

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("authToken") || "";
  };

  const openToast = (state: ToastState) => {
    setToast(state);
  };

  const simulate = async () => {
    setLoading(true);
    setHasSimulated(true);
    setError("");
    setSimulationResult(null);

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

      await simulate();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Monthly credit apply failed";

      openToast({
        variant: "failed",
        title: "Apply failed",
        message,
      });

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

  const creditRows = useMemo(() => {
    const rows = simulationResult?.would_credit_employees ?? [];
    const query = creditSearch.trim().toLowerCase();

    const filteredRows = rows.filter((row) => {
      const rowType = "non-teaching" as const;
      const matchesType =
        creditTypeFilter === "all" ||
        creditTypeFilter === rowType ||
        (creditTypeFilter === "not-on-leave" && !row.on_leave);

      const displayName = sanitizeDisplayName(row.employee_name);
      const matchesSearch =
        !query ||
        displayName.toLowerCase().includes(query) ||
        String(row.projected_balance?.bal_vl ?? "")
          .toLowerCase()
          .includes(query) ||
        String(row.projected_balance?.bal_sl ?? "")
          .toLowerCase()
          .includes(query);

      return matchesType && matchesSearch;
    });

    return [...filteredRows].sort((a, b) => {
      const comparison = sanitizeDisplayName(a.employee_name).localeCompare(
        sanitizeDisplayName(b.employee_name),
        "en",
        {
          sensitivity: "base",
        },
      );

      return creditSortOrder === "az" ? comparison : -comparison;
    });
  }, [creditSearch, creditSortOrder, creditTypeFilter, simulationResult]);

  const skipRows = useMemo(() => {
    const rows = simulationResult?.would_skip_employees ?? [];
    const query = skipSearch.trim().toLowerCase();

    const filteredRows = rows.filter((row) => {
      const teachingRelated = isTeachingRelatedReason(row.reason);

      const matchesType =
        skipTypeFilter === "all" ||
        (skipTypeFilter === "teaching" && teachingRelated) ||
        (skipTypeFilter === "non-teaching" && !teachingRelated) ||
        (skipTypeFilter === "teaching-related" && teachingRelated) ||
        (skipTypeFilter === "on-leave" && isOnLeaveReason(row.reason));

      const displayName = sanitizeDisplayName(row.employee_name);
      const matchesSearch =
        !query ||
        displayName.toLowerCase().includes(query) ||
        reasonLabel(row.reason).toLowerCase().includes(query) ||
        row.reason.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });

    return [...filteredRows].sort((a, b) => {
      const comparison = sanitizeDisplayName(a.employee_name).localeCompare(
        sanitizeDisplayName(b.employee_name),
        "en",
        {
          sensitivity: "base",
        },
      );

      return skipSortOrder === "az" ? comparison : -comparison;
    });
  }, [skipSearch, skipSortOrder, skipTypeFilter, simulationResult]);

  const showSkeleton = loading && !simulationResult;

  return (
    <>
      {showSkeleton ? (
        <MonthlyCreditSkeleton />
      ) : (
        <div className="w-full rounded-xl border border-gray-200 bg-white p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
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

            <div className="md:col-span-2 grid grid-cols-2 gap-2 sm:flex sm:items-end sm:flex-wrap">
              <button
                type="button"
                onClick={simulate}
                disabled={loading}
                className="col-span-1 cursor-pointer rounded-md bg-blue-100 px-3 py-1.5 text-[11px] font-medium text-blue-800 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:text-xs"
              >
                {loading ? "Processing..." : "Simulate"}
              </button>

              <button
                type="button"
                onClick={() => handleOpenAction("apply")}
                disabled={loading || !simulationResult}
                className="col-span-1 cursor-pointer rounded-md bg-emerald-100 px-3 py-1.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:text-xs"
              >
                Apply Real Credit
              </button>

              <button
                type="button"
                onClick={() => handleOpenAction("delete")}
                disabled={loading || !simulationResult}
                className="col-span-2 cursor-pointer rounded-md bg-rose-100 px-3 py-1.5 text-[11px] font-medium text-rose-800 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:text-xs"
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
                  <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-800 space-y-2">
                    <div>Employees To Credit</div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        value={creditSearch}
                        onChange={(e) => setCreditSearch(e.target.value)}
                        placeholder="Search employees..."
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <select
                        value={creditSortOrder}
                        onChange={(e) =>
                          setCreditSortOrder(
                            e.target.value === "za" ? "za" : "az",
                          )
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="az">A-Z</option>
                        <option value="za">Z-A</option>
                      </select>

                      <select
                        value={creditTypeFilter}
                        onChange={(e) =>
                          setCreditTypeFilter(
                            e.target.value === "non-teaching"
                              ? "non-teaching"
                              : e.target.value === "not-on-leave"
                                ? "not-on-leave"
                                : "all",
                          )
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="all">All Types</option>
                        <option value="non-teaching">Non-Teaching</option>
                        <option value="not-on-leave">Not on leave</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-auto">
                    <div className="flex flex-col gap-2 p-2 sm:hidden">
                      {creditRows.length > 0 ? (
                        creditRows.map((row) => (
                          <div
                            key={row.employee_id}
                            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                          >
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {sanitizeDisplayName(row.employee_name)}
                            </p>
                            <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                              <p className="text-gray-600">
                                VL:{" "}
                                <span className="font-semibold text-gray-800">
                                  {row.projected_balance?.bal_vl ?? "-"}
                                </span>
                              </p>
                              <p className="text-gray-600">
                                SL:{" "}
                                <span className="font-semibold text-gray-800">
                                  {row.projected_balance?.bal_sl ?? "-"}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="px-1 py-2 text-xs text-gray-500">
                          No employees match the selected filters.
                        </p>
                      )}
                    </div>

                    <div className="hidden sm:block">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-3 py-2 text-left text-sm uppercase tracking-wide">
                              Employee
                            </th>
                            <th className="px-3 py-2 text-left text-sm uppercase tracking-wide">
                              Projected VL
                            </th>
                            <th className="px-3 py-2 text-left text-sm uppercase tracking-wide">
                              Projected SL
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditRows.map((row, index) => {
                            const rowBackgroundClass =
                              index % 2 === 0 ? "bg-gray-100" : "bg-white";

                            return (
                              <tr
                                key={row.employee_id}
                                className={`border-t border-gray-100 ${rowBackgroundClass}`}
                              >
                                <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                  {sanitizeDisplayName(row.employee_name)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-700">
                                  {row.projected_balance?.bal_vl ?? "-"}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-700">
                                  {row.projected_balance?.bal_sl ?? "-"}
                                </td>
                              </tr>
                            );
                          })}

                          {creditRows.length === 0 ? (
                            <tr>
                              <td
                                className="px-3 py-3 text-sm text-gray-500"
                                colSpan={3}
                              >
                                No employees match the selected filters.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-800 space-y-2">
                    <div>Employees To Skip</div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        value={skipSearch}
                        onChange={(e) => setSkipSearch(e.target.value)}
                        placeholder="Search employees..."
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <select
                        value={skipSortOrder}
                        onChange={(e) =>
                          setSkipSortOrder(
                            e.target.value === "za" ? "za" : "az",
                          )
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="az">A-Z</option>
                        <option value="za">Z-A</option>
                      </select>

                      <select
                        value={skipTypeFilter}
                        onChange={(e) =>
                          setSkipTypeFilter(
                            e.target.value === "teaching"
                              ? "teaching"
                              : e.target.value === "non-teaching"
                                ? "non-teaching"
                                : e.target.value === "teaching-related"
                                  ? "teaching-related"
                                  : e.target.value === "on-leave"
                                    ? "on-leave"
                                    : "all",
                          )
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="all">All Types</option>
                        <option value="teaching">Teaching</option>
                        <option value="non-teaching">Non-Teaching</option>
                        <option value="teaching-related">Teaching Related</option>
                        <option value="on-leave">On-leave</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-auto">
                    <div className="flex flex-col gap-2 p-2 sm:hidden">
                      {skipRows.length > 0 ? (
                        skipRows.map((row) => (
                          <div
                            key={`${row.employee_id}-${row.reason}`}
                            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                          >
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {sanitizeDisplayName(row.employee_name)}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                              {reasonLabel(row.reason)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="px-1 py-2 text-xs text-gray-500">
                          No employees match the selected filters.
                        </p>
                      )}
                    </div>

                    <div className="hidden sm:block">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-3 py-2 text-left text-sm uppercase tracking-wide">
                              Employee
                            </th>
                            <th className="px-3 py-2 text-left text-sm uppercase tracking-wide">
                              Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {skipRows.map((row, index) => {
                            const rowBackgroundClass =
                              index % 2 === 0 ? "bg-gray-100" : "bg-white";

                            return (
                              <tr
                                key={`${row.employee_id}-${row.reason}`}
                                className={`border-t border-gray-100 ${rowBackgroundClass}`}
                              >
                                <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                  {sanitizeDisplayName(row.employee_name)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-700">
                                  {reasonLabel(row.reason)}
                                </td>
                              </tr>
                            );
                          })}

                          {skipRows.length === 0 ? (
                            <tr>
                              <td
                                className="px-3 py-3 text-sm text-gray-500"
                                colSpan={2}
                              >
                                No employees match the selected filters.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : hasSimulated && !loading && !error ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
              No simulation data found for the selected month.
            </div>
          ) : null}
        </div>
      )}

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
    </>
  );
}