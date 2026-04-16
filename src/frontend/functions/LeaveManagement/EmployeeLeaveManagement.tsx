"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import LeaveManagementModal from "@/frontend/functions/LeaveManagement/Modals/LeaveManagementModal";
import AddLeaveModal, {
  type AddLeaveFormValues,
} from "@/frontend/functions/LeaveManagement/Modals/AddLeaveModal";
import MonthlyCredit from "@/frontend/functions/LeaveManagement/MonthlyCredit/MonthlyCredit";
import { createLeave } from "@/frontend/functions/LeaveManagement/leaveApi";
import type { LeaveModalRecord } from "@/frontend/functions/LeaveManagement/leaveTypes";
import { getLeaveCardRoute } from "@/frontend/route";

type EmployeeRecordApi = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  school_name?: string | null;
  school_id?: number | null;
  employee_type?: "teaching" | "non-teaching";
  created_at?: string | null;
  on_leave?: boolean | number | string | null;
};

type EmployeeRecord = LeaveModalRecord & {
  employeeId: number;
  email: string;
  schoolId: number | null;
  schoolName: string;
  onLeave: boolean;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type SessionUser = {
  role?: string;
  school_id?: number | string | null;
  schoolId?: number | string | null;
};

const normalizeRole = (role: unknown) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");

const getScopedEmployeeEndpoint = () => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return "/api/employees/";
  }

  try {
    const parsed = JSON.parse(rawUser) as SessionUser;
    const normalizedRole = normalizeRole(parsed.role);
    const schoolId = Number(parsed.school_id ?? parsed.schoolId);
    const isSchoolScopedRole =
      normalizedRole === "ADMIN" || normalizedRole === "DATA_ENCODER";

    if (isSchoolScopedRole && Number.isFinite(schoolId) && schoolId > 0) {
      return "/api/employees/";
    }
  } catch {
    // Fall back to broad endpoint when user payload is malformed.
  }

  return "/api/employees/";
};

const getCurrentUserRole = (): string => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return "";
  }
  try {
    const parsed = JSON.parse(rawUser) as SessionUser;
    return normalizeRole(parsed.role);
  } catch {
    return "";
  }
};

const toBoolean = (value: unknown) => {
  if (value === true || value === 1 || value === "1") return true;
  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }
  return false;
};

const toEmployeeRecord = (item: EmployeeRecordApi): EmployeeRecord => {
  const firstName = item.first_name?.trim() || "Unknown";
  const middleName = item.middle_name?.trim() || "";
  const lastName = item.last_name?.trim() || "Employee";
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  return {
    id: item.id,
    employeeId: item.id,
    fullName,
    employeeType: item.employee_type || "non-teaching",
    periodOfLeave: "",
    particulars: "",
    balVl: 0,
    balSl: 0,
    dateOfAction: "",
    email: item.email?.trim() || "",
    schoolId:
      typeof item.school_id === "number" ? item.school_id || null : null,
    schoolName: item.school_name?.trim() || "",
    onLeave: toBoolean(item.on_leave),
  };
};

type EmployeeApiResponse = {
  data?: EmployeeRecordApi[];
  total?: number;
  page?: number;
  pageSize?: number;
  message?: string;
};

const parseApiBody = async <T extends { message?: string }>(
  response: Response,
): Promise<T> => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.toLowerCase().includes("application/json")) {
    return (await response.json().catch(() => ({}))) as T;
  }

  const text = await response.text().catch(() => "");
  return {
    message: text || undefined,
  } as T;
};

export default function EmployeeLeaveManagement() {
  const [activeTab, setActiveTab] = useState<
    "leave-records" | "monthly-credit"
  >("leave-records");
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<
    "ALL" | "teaching" | "non-teaching" | "teaching-related"
  >("ALL");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<
    "ALL" | "on-leave" | "not-on-leave"
  >("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [pageJumpInput, setPageJumpInput] = useState("1");

  const [employeeData, setEmployeeData] = useState<EmployeeRecord[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState("");

  const [leaveModalTarget, setLeaveModalTarget] =
    useState<LeaveModalRecord | null>(null);
  const [leaveModalInitialTab, setLeaveModalInitialTab] = useState<
    "history" | "card"
  >("history");
  const [directAddTarget, setDirectAddTarget] = useState<EmployeeRecord | null>(
    null,
  );
  const [isDirectAdding, setIsDirectAdding] = useState(false);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    setCurrentUserRole(getCurrentUserRole());
  }, []);

  const fetchEmployees = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setEmployeeLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const scopedEndpoint = getScopedEmployeeEndpoint();
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (employeeTypeFilter !== "ALL") {
        params.set("employee_type", employeeTypeFilter);
      }
      if (currentUserRole === "SUPER_ADMIN" && schoolFilter !== "ALL") {
        params.set("school_id", schoolFilter);
      }
      if (leaveStatusFilter !== "ALL") {
        params.set(
          "on_leave",
          leaveStatusFilter === "on-leave" ? "true" : "false",
        );
      }
      if (letterFilter !== "ALL") params.set("letter", letterFilter);
      params.set("sortOrder", sortOrder);
      params.set("page", String(currentPage));
      params.set("pageSize", String(itemsPerPage));

      const response = await fetch(
        `${API_BASE}${scopedEndpoint}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const body = await parseApiBody<EmployeeApiResponse>(response);
      if (!response.ok) {
        throw new Error(
          body.message ||
            `Failed to fetch employees (HTTP ${response.status}).`,
        );
      }

      const mapped = (body.data || []).map(toEmployeeRecord);
      setEmployeeData(mapped);
      setTotalItems(
        typeof body.total === "number" ? body.total : mapped.length,
      );
      setEmployeeError(null);
    } catch (err) {
      setEmployeeError(
        err instanceof Error ? err.message : "An error occurred",
      );
      if (showSpinner) {
        setEmployeeData([]);
        setTotalItems(0);
      }
    } finally {
      if (showSpinner) {
        setEmployeeLoading(false);
      }
    }
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetchEmployees();
    }, 300);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    employeeTypeFilter,
    schoolFilter,
    leaveStatusFilter,
    letterFilter,
    sortOrder,
    currentPage,
    itemsPerPage,
    currentUserRole,
  ]);

  const filteredEmployees = useMemo(() => employeeData, [employeeData]);

  const schoolOptions = useMemo(() => {
    const unique = new Map<number, string>();
    employeeData.forEach((employee) => {
      if (employee.schoolId && employee.schoolName.trim()) {
        unique.set(employee.schoolId, employee.schoolName.trim());
      }
    });
    return Array.from(unique.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employeeData]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedEmployees = filteredEmployees;
  const PAGE_WINDOW_SIZE = 5;
  const pageGroupStart =
    Math.floor((currentPage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
  const pageGroupEnd = Math.min(
    totalPages,
    pageGroupStart + PAGE_WINDOW_SIZE - 1,
  );
  const pageNumberItems: Array<number | "ellipsis"> = Array.from(
    { length: pageGroupEnd - pageGroupStart + 1 },
    (_, i) => pageGroupStart + i,
  );
  if (pageGroupEnd < totalPages) {
    if (totalPages - pageGroupEnd > 1) {
      pageNumberItems.push("ellipsis");
    }
    pageNumberItems.push(totalPages);
  }

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      return;
    }

    setPageJumpInput(String(currentPage));
  }, [currentPage, totalPages]);

  const handleSearch = () => {
    setCurrentPage(1);
    setPageJumpInput("1");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setEmployeeTypeFilter("ALL");
    setSchoolFilter("ALL");
    setLeaveStatusFilter("ALL");
    setLetterFilter("ALL");
    setSortOrder("asc");
    setCurrentPage(1);
    setPageJumpInput("1");
  };

  const handleJumpToPage = () => {
    const parsed = Number.parseInt(pageJumpInput, 10);
    if (Number.isNaN(parsed)) {
      setPageJumpInput(String(currentPage));
      return;
    }

    const nextPage = Math.min(totalPages, Math.max(1, parsed));
    setCurrentPage(nextPage);
    setPageJumpInput(String(nextPage));
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    employeeTypeFilter !== "ALL" ||
    schoolFilter !== "ALL" ||
    leaveStatusFilter !== "ALL" ||
    letterFilter !== "ALL" ||
    sortOrder !== "asc";

  const handleDirectCreate = async (payload: AddLeaveFormValues) => {
    try {
      setIsDirectAdding(true);
      await createLeave({
        employee_id: payload.employee_id,
        period_of_leave: payload.period_of_leave,
        particulars: payload.particulars,
        earned_vl: payload.earned_vl,
        abs_with_pay_vl: payload.abs_with_pay_vl,
        abs_without_pay_vl: payload.abs_without_pay_vl,
        earned_sl: payload.earned_sl,
        abs_with_pay_sl: payload.abs_with_pay_sl,
        abs_without_pay_sl: payload.abs_without_pay_sl,
      });
      fetchEmployees(false);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to create leave entry.",
      );
      throw err;
    } finally {
      setIsDirectAdding(false);
    }
  };

  const openLeaveModal = (
    employee: EmployeeRecord,
    tab: "history" | "card",
  ) => {
    setLeaveModalInitialTab(tab);
    setLeaveModalTarget({
      id: employee.id,
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      employeeType: employee.employeeType,
      schoolName: employee.schoolName,
      periodOfLeave: employee.periodOfLeave,
      particulars: employee.particulars,
      balVl: employee.balVl,
      balSl: employee.balSl,
      dateOfAction: employee.dateOfAction,
    });
  };

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-start">
        <button
          type="button"
          onClick={() => setActiveTab("leave-records")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "leave-records"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <FileText size={14} />
            Leave Records
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("monthly-credit")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "monthly-credit"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <CalendarDays size={14} />
            Monthly Credit
          </span>
        </button>
      </div>

      {activeTab === "leave-records" ? (
        <div className="w-full min-w-0 bg-white rounded-lg shadow-lg p-2 sm:p-3 sticky top-0 sm:top-4 flex flex-col">
          <h1
            style={{ fontSize: "20px" }}
            className="font-bold text-gray-900 mb-2 sm:mb-4 inline-flex items-center gap-2"
          >
            <FileText size={22} className="text-blue-600" />
            Employee Leave Management
          </h1>

          <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex-1 relative min-w-0">
                <input
                  type="text"
                  placeholder="Search employee"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-gray-500 w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                className="inline-flex shrink-0 items-center gap-1 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer sm:px-5"
              >
                <Search size={14} />
                Search
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
              <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <select
                  value={employeeTypeFilter}
                  onChange={(e) => {
                    setEmployeeTypeFilter(
                      e.target.value as
                        | "ALL"
                        | "teaching"
                        | "non-teaching"
                        | "teaching-related",
                    );
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="ALL">All Employee Types</option>
                  <option value="teaching">Teaching</option>
                  <option value="non-teaching">Non-Teaching</option>
                  <option value="teaching-related">Teaching-Related</option>
                </select>

                {currentUserRole === "SUPER_ADMIN" ? (
                  <select
                    value={schoolFilter}
                    onChange={(e) => {
                      setSchoolFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-auto text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="ALL">All Schools</option>
                    {schoolOptions.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                ) : null}

                <select
                  value={letterFilter}
                  onChange={(e) => {
                    setLetterFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="ALL">All Letters</option>
                  {alphabet.map((letter) => (
                    <option key={letter} value={letter}>
                      {letter}
                    </option>
                  ))}
                </select>

                <select
                  value={leaveStatusFilter}
                  onChange={(e) => {
                    setLeaveStatusFilter(
                      e.target.value as "ALL" | "on-leave" | "not-on-leave",
                    );
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="ALL">All Leave Status</option>
                  <option value="on-leave">On Leave</option>
                  <option value="not-on-leave">Not On Leave</option>
                </select>

                <button
                  onClick={() => {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                  className="w-full sm:w-auto text-gray-500 flex items-center justify-center gap-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
                >
                  {sortOrder === "asc" ? (
                    <>
                      <ArrowUpAZ size={16} />
                      A-Z
                    </>
                  ) : (
                    <>
                      <ArrowDownAZ size={16} />
                      Z-A
                    </>
                  )}
                </button>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="col-span-2 sm:col-span-1 sm:w-auto text-sm text-gray-500 underline hover:text-gray-700 transition cursor-pointer text-right sm:text-left"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[42vh] sm:max-h-[50vh]">
            {employeeLoading ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-gray-500">Loading employees...</p>
              </div>
            ) : employeeError ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-red-500">Error: {employeeError}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 sm:hidden">
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((employee) => {
                      const isOnLeave = employee.onLeave;

                      return (
                        <div
                          key={employee.id}
                          className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                        >
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {employee.fullName}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {employee.employeeType}
                          </p>
                          <div className="mt-1">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                isOnLeave
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {isOnLeave ? "On leave" : "Not on leave"}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openLeaveModal(employee, "history")
                              }
                              aria-label="View details"
                              title="Details"
                              className="inline-flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 transition cursor-pointer"
                            >
                              <Info size={12} />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => setDirectAddTarget(employee)}
                              aria-label="Add leave"
                              title="Add Leave"
                              className="inline-flex items-center gap-1 rounded bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 transition cursor-pointer"
                            >
                              <Plus size={12} />
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  getLeaveCardRoute(employee.id),
                                  "_blank",
                                )
                              }
                              aria-label="Preview leave PDF"
                              title="Preview PDF"
                              className="inline-flex items-center gap-1 rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition cursor-pointer"
                            >
                              <FileText size={12} />
                              PDF
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-8 text-center text-gray-500 text-sm">
                      No employees found.
                    </p>
                  )}
                </div>

                <div className="hidden sm:block">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-blue-100">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                          Name
                        </th>
                        <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                          Employee Type
                        </th>
                        <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                          Leave Status
                        </th>
                        <th className="text-right py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.length > 0 ? (
                        paginatedEmployees.map((employee) => {
                          const isOnLeave = employee.onLeave;

                          return (
                            <tr
                              key={employee.id}
                              className="border-b border-gray-100 hover:bg-gray-50 transition"
                            >
                              <td className="py-1 px-3 text-gray-900 text-sm font-medium">
                                {employee.fullName}
                              </td>
                              <td className="py-1 px-3 text-gray-500 text-sm capitalize">
                                {employee.employeeType}
                              </td>
                              <td className="py-1 px-3 text-gray-500 text-sm">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                                    isOnLeave
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {isOnLeave ? "On leave" : "Not on leave"}
                                </span>
                              </td>
                              <td className="py-1 px-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openLeaveModal(employee, "history")
                                    }
                                    aria-label="View details"
                                    title="Details"
                                    className="inline-flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 transition cursor-pointer"
                                  >
                                    <Info size={12} />
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDirectAddTarget(employee)}
                                    aria-label="Add leave"
                                    title="Add Leave"
                                    className="inline-flex items-center gap-1 rounded bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 transition cursor-pointer"
                                  >
                                    <Plus size={12} />
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      window.open(
                                        getLeaveCardRoute(employee.id),
                                        "_blank",
                                      )
                                    }
                                    aria-label="Preview leave PDF"
                                    title="Preview PDF"
                                    className="inline-flex items-center gap-1 rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition cursor-pointer"
                                  >
                                    <FileText size={12} />
                                    PDF
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-8 text-center text-gray-500"
                          >
                            No employees found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {filteredEmployees.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  Show
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                      setPageJumpInput("1");
                    }}
                    className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  entries
                </label>

                <div className="flex items-center justify-center gap-2 sm:justify-self-center">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {pageNumberItems.map(
                    (item: number | "ellipsis", index: number) => {
                      if (item === "ellipsis") {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-sm text-gray-400 select-none"
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`w-9 h-9 rounded font-medium text-sm transition cursor-pointer ${
                            currentPage === item
                              ? "bg-blue-600 text-white"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    },
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 sm:justify-self-end">
                  <span>Jump to</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageJumpInput}
                    onChange={(e) => setPageJumpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleJumpToPage();
                      }
                    }}
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
                  />
                  <button
                    onClick={handleJumpToPage}
                    className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <MonthlyCredit />
      )}

      <LeaveManagementModal
        isOpen={Boolean(leaveModalTarget)}
        leave={leaveModalTarget}
        initialTab={leaveModalInitialTab}
        onLeaveStatusChanged={() => fetchEmployees(false)}
        onClose={() => setLeaveModalTarget(null)}
      />
      <AddLeaveModal
        isOpen={Boolean(directAddTarget)}
        employeeId={directAddTarget?.id ?? null}
        employeeName={directAddTarget?.fullName ?? ""}
        onClose={() => setDirectAddTarget(null)}
        onSave={handleDirectCreate}
        isSaving={isDirectAdding}
      />
    </div>
  );
}
