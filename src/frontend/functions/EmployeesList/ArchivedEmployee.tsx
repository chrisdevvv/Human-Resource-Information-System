"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Undo2,
  X,
} from "lucide-react";
import UnarchiveConfirmationModal from "./modals/UnarchiveConfirmationModal";
import { unarchiveEmployee } from "../LeaveManagement/leaveApi";

type EmployeeRecordApi = {
  id: number;
  first_name: string;
  middle_name?: string | null;
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
  const middleName = item.middle_name?.trim() || "";
  const lastName = item.last_name?.trim() || "Employee";
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
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
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-2 sm:p-3 sticky top-0 sm:top-4 flex flex-col">
      <h1
        style={{ fontSize: "20px" }}
        className="font-bold text-gray-900 mb-2 sm:mb-4 inline-flex items-center gap-2"
      >
        <Archive size={22} className="text-blue-600" />
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
              className="text-gray-500 w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-1 px-5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer"
          >
            <Search size={14} />
            Search
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditToggle}
              className={`px-3 py-1.5 rounded-lg transition font-medium text-sm cursor-pointer ${
                isEditMode
                  ? "bg-gray-700 text-white hover:bg-gray-800"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {isEditMode ? <X size={14} /> : <Pencil size={14} />}
                {isEditMode ? "Cancel" : "Edit"}
              </span>
            </button>
            {isEditMode && (
              <button
                onClick={handleBulkUnarchiveClick}
                disabled={selectedEmployeeIds.size === 0 || isUnarchiving}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition font-medium text-sm cursor-pointer bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Undo2 size={14} />
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
              className="w-full sm:w-auto text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
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
              className="w-full sm:w-auto text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
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
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[42vh] sm:max-h-[50vh]">
        {employeeLoading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-gray-500">Loading archived employees...</p>
          </div>
        ) : employeeError ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-red-500">Error: {employeeError}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-blue-100">
              <tr className="border-b-2 border-gray-200">
                {isEditMode && (
                  <th className="text-center py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
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
                <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                  Name
                </th>
                <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                  Employee Type
                </th>
                <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                  Email
                </th>
                <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                  School
                </th>
                <th className="text-center py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
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

      <UnarchiveConfirmationModal
        isOpen={isUnarchiveOpen}
        onClose={() => setIsUnarchiveOpen(false)}
        onConfirm={handleUnarchiveConfirm}
        isLoading={isUnarchiving}
        error={unarchiveError}
        employeeName={selectedEmployeeName}
      />

      {showUnarchiveSuccess && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] rounded-xl border border-blue-200 bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
              <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
            </div>

            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-900">
                Restore Successful
              </h2>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                {lastUnarchivedCount > 1 ? (
                  <>
                    <span className="font-semibold text-gray-800">
                      {lastUnarchivedCount} employees
                    </span>{" "}
                    have been restored and are now active again.
                  </>
                ) : selectedEmployeeName ? (
                  <>
                    <span className="font-semibold text-gray-800">
                      {selectedEmployeeName}
                    </span>{" "}
                    has been restored and is now active again.
                  </>
                ) : (
                  "The employee has been restored and is now active again."
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowUnarchiveSuccess(false)}
              className="cursor-pointer text-gray-400 hover:text-gray-700"
              aria-label="Close restore success toast"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

