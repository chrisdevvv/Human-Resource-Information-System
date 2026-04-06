"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  Archive,
  Plus,
  CheckCircle2,
  X,
} from "lucide-react";
import AddEmployeeModal from "./modals/AddEmployeeModal";
import ArchivedEmployee from "./ArchivedEmployee";
import ArchiveConfirmationModal from "./modals/ArchiveConfirmationModal";
import ArchiveSuccessMessage from "../LeaveManagement/ArchiveSuccessMessage";
import { archiveEmployee } from "../LeaveManagement/leaveApi";

type EmployeeRecordApi = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  school_name?: string | null;
  employee_type?: "teaching" | "non-teaching";
};

type EmployeeRecord = {
  id: number;
  email: string;
  fullName: string;
  employeeType: "teaching" | "non-teaching";
  schoolName: string;
};

type EmployeeApiResponse = {
  data?: EmployeeRecordApi[];
  message?: string;
};

type SessionUser = {
  role?: string;
  school_id?: number | string | null;
  schoolId?: number | string | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
      return `/api/employees/school/${schoolId}`;
    }
  } catch {
    // Fall back to broad endpoint when user payload is malformed.
  }

  return "/api/employees/";
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
  };
};

export default function EmployeesListLayout() {
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "archived">("list");
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
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [showArchiveSuccess, setShowArchiveSuccess] = useState(false);
  const [selectedArchiveEmployee, setSelectedArchiveEmployee] =
    useState<EmployeeRecord | null>(null);
  const [showAddSuccessToast, setShowAddSuccessToast] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState("");

  useEffect(() => {
    if (!showAddSuccessToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowAddSuccessToast(false);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [showAddSuccessToast]);

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
      const response = await fetch(`${API_BASE}${scopedEndpoint}`, {
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
    if (activeTab !== "list") {
      return;
    }

    fetchEmployees();
    const intervalId = window.setInterval(() => {
      fetchEmployees(false);
    }, 5000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  const handleOpenArchive = (employee: EmployeeRecord) => {
    setSelectedArchiveEmployee(employee);
    setArchiveError(null);
    setIsArchiveOpen(true);
  };

  const handleArchiveConfirm = async (password: string) => {
    if (!selectedArchiveEmployee) {
      return;
    }

    setIsArchiving(true);
    setArchiveError(null);
    try {
      await archiveEmployee(selectedArchiveEmployee.id, password);
      setIsArchiveOpen(false);
      setShowArchiveSuccess(true);
      await fetchEmployees(false);
    } catch (err) {
      setArchiveError(
        err instanceof Error
          ? err.message
          : "Failed to archive employee. Please try again.",
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveSuccessClose = () => {
    setShowArchiveSuccess(false);
    setSelectedArchiveEmployee(null);
  };

  return (
    <div className="w-full">
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-2 font-medium text-sm rounded-t-lg transition cursor-pointer ${
            activeTab === "list"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Employees List
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          className={`px-6 py-2 font-medium text-sm rounded-t-lg transition cursor-pointer ${
            activeTab === "archived"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Archived Employee
        </button>
      </div>

      {activeTab === "list" ? (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-3 sm:p-6 sticky top-0 sm:top-4 flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">
            Employees List
          </h1>

          <div className="mb-4 flex items-center justify-start">
            <button
              type="button"
              onClick={() => setIsAddEmployeeOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer"
            >
              <Plus size={16} />
              Add Employee
            </button>
          </div>

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
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b-2 border-gray-200">
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
                    <th className="text-right py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((employee) => {
                      return (
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
                          <td className="py-2 px-3 text-gray-500 text-sm">
                            {employee.email || "N/A"}
                          </td>
                          <td className="py-2 px-3 text-gray-500 text-sm">
                            {employee.schoolName || "N/A"}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenArchive(employee)}
                                className="inline-flex items-center gap-1 rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900 transition cursor-pointer"
                                aria-label="Archive employee"
                                title="Archive"
                              >
                                <Archive size={12} />
                                Archive
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-500"
                      >
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

                {pageNumberItems.map((item, index) => {
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
        </div>
      ) : (
        <ArchivedEmployee />
      )}

      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={(employeeName) => {
          setIsAddEmployeeOpen(false);
          setAddSuccessMessage(
            employeeName
              ? `${employeeName} has been added to the system.`
              : "Employee has been added to the system.",
          );
          setShowAddSuccessToast(true);
          if (activeTab === "list") {
            fetchEmployees(false);
          }
        }}
      />

      <ArchiveConfirmationModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchiveConfirm}
        isLoading={isArchiving}
        error={archiveError}
        employeeName={selectedArchiveEmployee?.fullName}
      />

      <ArchiveSuccessMessage
        isVisible={showArchiveSuccess}
        employeeName={selectedArchiveEmployee?.fullName}
        onClose={handleArchiveSuccessClose}
        autoCloseDuration={2000}
      />

      {showAddSuccessToast ? (
        <div className="fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 text-emerald-600" size={18} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Success</p>
              <p className="text-sm text-gray-600">{addSuccessMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddSuccessToast(false)}
              className="cursor-pointer text-gray-400 hover:text-gray-700"
              aria-label="Close toast"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
