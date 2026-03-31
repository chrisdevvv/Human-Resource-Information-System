"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import UnarchiveConfirmationModal from "./UnarchiveConfirmationModal";
import { unarchiveEmployee } from "../LeaveManagement/leaveApi";

type EmployeeRecordApi = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  school_name?: string | null;
  employee_type?: "teaching" | "non-teaching";
  created_at?: string | null;
  is_archived?: number;
};

type EmployeeRecord = {
  id: number;
  fullName: string;
  employeeType: "teaching" | "non-teaching";
  email: string;
  schoolName: string;
  createdAt?: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

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

const getArchivedEmployeesEndpoint = () => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return "/api/employees?include_archived=true";
  }

  try {
    const parsed = JSON.parse(rawUser) as SessionUser;
    const normalizedRole = normalizeRole(parsed.role);
    const schoolId = Number(parsed.school_id ?? parsed.schoolId);
    const isSchoolScopedRole =
      normalizedRole === "ADMIN" || normalizedRole === "DATA_ENCODER";

    if (isSchoolScopedRole && Number.isFinite(schoolId) && schoolId > 0) {
      return `/api/employees/school/${schoolId}?include_archived=true`;
    }
  } catch {
    // Fall back to broad endpoint when user payload is malformed.
  }

  return "/api/employees?include_archived=true";
};

const toEmployeeRecord = (item: EmployeeRecordApi): EmployeeRecord => {
  const firstName = item.first_name?.trim() || "Unknown";
  const lastName = item.last_name?.trim() || "Employee";
  const fullName = `${firstName} ${lastName}`.trim();
  return {
    id: item.id,
    fullName,
    employeeType: item.employee_type || "non-teaching",
    email: item.email?.trim() || "",
    schoolName: item.school_name?.trim() || "",
    createdAt: item.created_at || undefined,
  };
};

type EmployeeApiResponse = {
  data?: EmployeeRecordApi[];
  message?: string;
};

export default function ArchivedEmployee() {
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

  const [isUnarchiveOpen, setIsUnarchiveOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(
    new Set(),
  );
  const [pendingUnarchiveIds, setPendingUnarchiveIds] = useState<number[]>([]);
  const [lastUnarchivedCount, setLastUnarchivedCount] = useState(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [unarchiveError, setUnarchiveError] = useState<string | null>(null);
  const [showUnarchiveSuccess, setShowUnarchiveSuccess] = useState(false);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleUnarchiveClick = (id: number, fullName: string) => {
    setPendingUnarchiveIds([id]);
    setSelectedEmployeeId(id);
    setSelectedEmployeeName(fullName);
    setIsUnarchiveOpen(true);
    setUnarchiveError(null);
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      setSelectedEmployeeIds(new Set());
    }
    setIsEditMode((prev) => !prev);
    setUnarchiveError(null);
  };

  const handleSelectEmployee = (id: number) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredEmployees.map((employee) => employee.id);
    const areAllSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedEmployeeIds.has(id));

    setSelectedEmployeeIds(() => {
      if (areAllSelected) {
        return new Set();
      }
      return new Set(filteredIds);
    });
  };

  const handleBulkUnarchiveClick = () => {
    const ids = Array.from(selectedEmployeeIds);
    if (ids.length === 0) {
      setUnarchiveError("Please select at least one employee to unarchive.");
      return;
    }

    setPendingUnarchiveIds(ids);
    setSelectedEmployeeId(null);
    setSelectedEmployeeName(
      `${ids.length} employee${ids.length > 1 ? "s" : ""}`,
    );
    setIsUnarchiveOpen(true);
    setUnarchiveError(null);
  };

  const handleUnarchiveConfirm = async (password: string) => {
    const targetIds =
      pendingUnarchiveIds.length > 0
        ? pendingUnarchiveIds
        : selectedEmployeeId
          ? [selectedEmployeeId]
          : [];
    if (targetIds.length === 0) return;

    setIsUnarchiving(true);
    setUnarchiveError(null);
    try {
      for (const employeeId of targetIds) {
        await unarchiveEmployee(employeeId, password);
      }

      setLastUnarchivedCount(targetIds.length);
      setShowUnarchiveSuccess(true);
      setIsUnarchiveOpen(false);
      setSelectedEmployeeIds(new Set());
      setPendingUnarchiveIds([]);
      setIsEditMode(false);
      // Refresh the list after a short delay
      setTimeout(() => {
        setShowUnarchiveSuccess(false);
        fetchArchivedEmployees(false);
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to restore employee. Please try again.";
      setUnarchiveError(errorMessage);
    } finally {
      setIsUnarchiving(false);
    }
  };

  const fetchArchivedEmployees = async (showSpinner = true) => {
    try {
      if (showSpinner) setEmployeeLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");
      const scopedEndpoint = getArchivedEmployeesEndpoint();
      const response = await fetch(`${API_BASE}${scopedEndpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const body = (await response.json()) as EmployeeApiResponse;
      if (!response.ok)
        throw new Error(body.message || "Failed to fetch employees");
      // Only keep archived
      const mapped = (body.data || [])
        .filter((e) => e.is_archived === 1)
        .map(toEmployeeRecord);
      setEmployeeData(mapped);
      setEmployeeError(null);
    } catch (err) {
      setEmployeeError(
        err instanceof Error ? err.message : "An error occurred",
      );
      setEmployeeData([]);
    } finally {
      if (showSpinner) setEmployeeLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedEmployees();
    const intervalId = window.setInterval(() => {
      fetchArchivedEmployees(false);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Keep selection valid when data refreshes.
    const currentIds = new Set(employeeData.map((employee) => employee.id));
    setSelectedEmployeeIds((prev) => {
      const next = new Set<number>();
      prev.forEach((id) => {
        if (currentIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [employeeData]);

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

  const areAllFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((employee) => selectedEmployeeIds.has(employee.id));

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

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-3 sm:p-6 sticky top-0 sm:top-4 h-screen sm:h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">
        Archived Employee
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

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditToggle}
              className={`px-4 py-2 rounded-lg transition font-medium text-sm cursor-pointer ${
                isEditMode
                  ? "bg-gray-700 text-white hover:bg-gray-800"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isEditMode ? "Cancel" : "Edit"}
            </button>
            {isEditMode && (
              <button
                onClick={handleBulkUnarchiveClick}
                disabled={selectedEmployeeIds.size === 0 || isUnarchiving}
                className="px-4 py-2 rounded-lg transition font-medium text-sm cursor-pointer bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Unarchive Selected ({selectedEmployeeIds.size})
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
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
            <p className="text-gray-500">Loading archived employees...</p>
          </div>
        ) : employeeError ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Error: {employeeError}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b-2 border-gray-200">
                {isEditMode && (
                  <th className="text-center py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={areAllFilteredSelected}
                        onChange={handleSelectAllFiltered}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300"
                      />
                      <span>Select All</span>
                    </label>
                  </th>
                )}
                <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                  Name
                </th>
                <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                  Employee Type
                </th>
                <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                  Email
                </th>
                <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                  School
                </th>
                <th className="text-center py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                  Action
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
                    {isEditMode && (
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.has(employee.id)}
                          onChange={() => handleSelectEmployee(employee.id)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="py-2 px-3 text-gray-900 text-sm font-medium">
                      {employee.fullName}
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-sm capitalize">
                      {employee.employeeType}
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-sm">
                      {employee.email}
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-sm">
                      {employee.schoolName}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() =>
                          handleUnarchiveClick(employee.id, employee.fullName)
                        }
                        disabled={
                          isUnarchiving || showUnarchiveSuccess || isEditMode
                        }
                        className="cursor-pointer rounded px-3 py-1 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Unarchive
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isEditMode ? 6 : 5}
                    className="py-8 text-center text-gray-500"
                  >
                    No archived employees found.
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

            {pageNumberItems.map((item: number | "ellipsis", index: number) => {
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
            })}

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

      <UnarchiveConfirmationModal
        isOpen={isUnarchiveOpen}
        onClose={() => setIsUnarchiveOpen(false)}
        onConfirm={handleUnarchiveConfirm}
        isLoading={isUnarchiving}
        error={unarchiveError}
        employeeName={selectedEmployeeName}
      />

      {showUnarchiveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-pulse">
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Restore Successful!
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {lastUnarchivedCount > 1 ? (
                  <>
                    <span className="font-semibold text-gray-900">
                      {lastUnarchivedCount} employees
                    </span>{" "}
                    have been successfully restored and are now active again.
                  </>
                ) : selectedEmployeeName ? (
                  <>
                    <span className="font-semibold text-gray-900">
                      {selectedEmployeeName}
                    </span>{" "}
                    has been successfully restored. The employee is now active
                    again and will appear in the active employee list.
                  </>
                ) : (
                  "The employee has been successfully restored."
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
