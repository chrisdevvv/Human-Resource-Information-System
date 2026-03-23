"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Plus,
} from "lucide-react";
import LeaveManagementModal from "@/frontend/functions/LeaveManagement/LeaveManagementModal";
import AddLeaveModal, {
  type AddLeaveFormValues,
} from "@/frontend/functions/LeaveManagement/AddLeaveModal";
import AddEmployeeModal from "./AddEmployeeModal";
import { createLeave } from "@/frontend/functions/LeaveManagement/leaveApi";
import type { LeaveModalRecord } from "@/frontend/functions/LeaveManagement/leaveTypes";

type EmployeeRecordApi = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  school_name?: string | null;
  employee_type?: "teaching" | "non-teaching";
  created_at?: string | null;
};

type EmployeeRecord = LeaveModalRecord & {
  employeeId: number;
  email: string;
  schoolName: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const toEmployeeRecord = (item: EmployeeRecordApi): EmployeeRecord => {
  const firstName = item.first_name?.trim() || "Unknown";
  const lastName = item.last_name?.trim() || "Employee";
  const fullName = `${firstName} ${lastName}`.trim();

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
    schoolName: item.school_name?.trim() || "",
  };
};

type EmployeeApiResponse = {
  data?: EmployeeRecordApi[];
  message?: string;
};

export default function EmployeeLeaveManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<
    "ALL" | "teaching" | "non-teaching"
  >("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [pageJumpInput, setPageJumpInput] = useState("1");

  const [employeeData, setEmployeeData] = useState<EmployeeRecord[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

  const [leaveModalTarget, setLeaveModalTarget] =
    useState<LeaveModalRecord | null>(null);
  const [leaveModalInitialTab, setLeaveModalInitialTab] = useState<
    "history" | "card"
  >("history");
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const [directAddTarget, setDirectAddTarget] = useState<EmployeeRecord | null>(
    null,
  );
  const [isDirectAdding, setIsDirectAdding] = useState(false);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const fetchEmployees = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setEmployeeLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch("http://localhost:3000/api/employees/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const body = (await response.json()) as EmployeeApiResponse;
      if (!response.ok) {
        throw new Error(body.message || "Failed to fetch employees");
      }

      const mapped = (body.data || []).map(toEmployeeRecord);
      setEmployeeData(mapped);
      setEmployeeError(null);
    } catch (err) {
      setEmployeeError(
        err instanceof Error ? err.message : "An error occurred",
      );
      if (showSpinner) {
        setEmployeeData([]);
      }
    } finally {
      if (showSpinner) {
        setEmployeeLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEmployees();

    const intervalId = window.setInterval(() => {
      fetchEmployees(false);
    }, 5000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEmployees = useMemo(() => {
    return employeeData
      .filter((employee) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          employee.fullName.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query) ||
          employee.schoolName.toLowerCase().includes(query);

        const matchesEmployeeType =
          employeeTypeFilter === "ALL" ||
          employee.employeeType === employeeTypeFilter;

        const matchesLetter =
          letterFilter === "ALL" ||
          employee.fullName.charAt(0).toUpperCase() === letterFilter;

        return matchesSearch && matchesEmployeeType && matchesLetter;
      })
      .sort((a, b) => {
        if (sortOrder === "asc") {
          return a.fullName.localeCompare(b.fullName);
        }

        return b.fullName.localeCompare(a.fullName);
      });
  }, [employeeData, searchQuery, employeeTypeFilter, letterFilter, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / itemsPerPage),
  );
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(
    startIdx,
    startIdx + itemsPerPage,
  );
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
      periodOfLeave: employee.periodOfLeave,
      particulars: employee.particulars,
      balVl: employee.balVl,
      balSl: employee.balSl,
      dateOfAction: employee.dateOfAction,
    });
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-3 sm:p-6 sticky top-0 sm:top-4 h-screen sm:h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">
          Leave Management
        </h1>

        <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search employee"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-gray-500 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIsAddEmployeeOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer"
            >
              <Plus size={16} />
              Add Employee
            </button>

            <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-3">
              <select
                value={employeeTypeFilter}
                onChange={(e) => {
                  setEmployeeTypeFilter(
                    e.target.value as "ALL" | "teaching" | "non-teaching",
                  );
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
              >
                <option value="ALL">All Employee Types</option>
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
              </select>

              <select
                value={letterFilter}
                onChange={(e) => {
                  setLetterFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
              >
                <option value="ALL">All Letters</option>
                {alphabet.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
                className="w-full sm:w-auto text-gray-500 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
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
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          {employeeLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading employees...</p>
            </div>
          ) : employeeError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Error: {employeeError}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                    Name
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                    Employee Type
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-2 px-3 text-gray-900 text-sm font-medium">
                        {employee.fullName}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-sm capitalize">
                        {employee.employeeType}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openLeaveModal(employee, "history")}
                            aria-label="View leave"
                            title="View"
                            className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDirectAddTarget(employee)}
                            aria-label="Add leave"
                            title="Add Leave"
                            className="p-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `/leave-card/${employee.id}`,
                                "_blank",
                              )
                            }
                            aria-label="Preview leave PDF"
                            title="Preview PDF"
                            className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition cursor-pointer"
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {filteredEmployees.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
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

              <div className="flex items-center gap-2 text-sm text-gray-600">
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

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              {pageNumberItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-sm text-gray-400 select-none"
                  >
                    ...
                  </span>
                ) : (
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
                ),
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
          </div>
        )}
      </div>

      <LeaveManagementModal
        isOpen={Boolean(leaveModalTarget)}
        leave={leaveModalTarget}
        initialTab={leaveModalInitialTab}
        onClose={() => setLeaveModalTarget(null)}
      />
      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={() => {
          setIsAddEmployeeOpen(false);
          fetchEmployees(false);
        }}
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
