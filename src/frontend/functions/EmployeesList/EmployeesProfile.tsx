"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  Archive,
  UserX,
  Users,
  Plus,
  CheckCircle2,
  Search,
  X,
  Eye,
} from "lucide-react";
import AddEmployeeModal from "@/frontend/functions/EmployeesList/modals/AddEmployeeModal";
import ArchivedEmployee from "./ArchivedEmployee";
import ArchiveConfirmationModal from "./modals/ArchiveConfirmationModal";
import ArchiveSuccessMessage from "../LeaveManagement/ArchiveSuccessMessage";
import ViewEmployeeModal from "./EmployeeDetails/ViewEmployeeModal";
import ToastMessage from "../../components/ToastMessage";
import { archiveEmployee } from "../LeaveManagement/leaveApi";

type EmployeeRecordApi = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  school_name?: string | null;
  school_id?: number | null;
  employee_type?: "teaching" | "non-teaching" | "teaching-related";
  birthdate?: string | null;
};

type EmployeeRecord = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  fullName: string;
  employeeType: "teaching" | "non-teaching" | "teaching-related";
  schoolId: number | null;
  schoolName: string;
  birthdate: string;
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

type SessionUser = {
  role?: string;
  school_id?: number | string | null;
  schoolId?: number | string | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const EMPLOYEES_LIST_TAB_KEY = "employeesList:activeTab";

const getInitialEmployeesTab = (): "list" | "archived" => {
  if (typeof window === "undefined") {
    return "list";
  }

  const storedTab = window.localStorage.getItem(EMPLOYEES_LIST_TAB_KEY);
  if (storedTab === "archived") {
    window.localStorage.removeItem(EMPLOYEES_LIST_TAB_KEY);
    return "archived";
  }

  return "list";
};

const normalizeRole = (role: unknown) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");

const getEmployeesEndpoint = () => {
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

const computeAge = (birthdate: string | null | undefined): number | null => {
  if (!birthdate) return null;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
};

const toEmployeeRecord = (item: EmployeeRecordApi): EmployeeRecord => {
  const firstName = item.first_name?.trim() || "Unknown";
  const rawMiddleName = item.middle_name?.trim() || "";
  const middleName = rawMiddleName.toUpperCase() === "N/A" ? "" : rawMiddleName;
  const lastName = item.last_name?.trim() || "Employee";
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  return {
    id: item.id,
    firstName,
    middleName,
    lastName,
    fullName,
    employeeType: item.employee_type || "non-teaching",
    email: item.email?.trim() || "",
    schoolId:
      typeof item.school_id === "number" ? item.school_id || null : null,
    schoolName: item.school_name?.trim() || "",
    birthdate: typeof item.birthdate === "string" ? item.birthdate || "" : "",
  };
};

export default function EmployeesListLayout() {
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "archived">(
    getInitialEmployeesTab,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<
    "ALL" | "teaching" | "non-teaching" | "teaching-related"
  >("ALL");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [retirementFilter, setRetirementFilter] = useState<
    "ALL" | "retirable" | "mandatory"
  >("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [pageJumpInput, setPageJumpInput] = useState("1");

  const [employeeData, setEmployeeData] = useState<EmployeeRecord[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedViewEmployee, setSelectedViewEmployee] =
    useState<EmployeeRecord | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [showArchiveSuccess, setShowArchiveSuccess] = useState(false);
  const [selectedArchiveEmployee, setSelectedArchiveEmployee] =
    useState<EmployeeRecord | null>(null);
  const [showAddSuccessToast, setShowAddSuccessToast] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");

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

      const scopedEndpoint = getEmployeesEndpoint();
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (employeeTypeFilter !== "ALL") {
        params.set("employee_type", employeeTypeFilter);
      }
      if (currentUserRole === "SUPER_ADMIN" && schoolFilter !== "ALL") {
        params.set("school_id", schoolFilter);
      }
      if (letterFilter !== "ALL") params.set("letter", letterFilter);
      if (retirementFilter !== "ALL")
        params.set("retirement", retirementFilter);
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
    if (activeTab !== "list") {
      return;
    }

    const id = window.setTimeout(() => {
      fetchEmployees();
    }, 300);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    searchQuery,
    employeeTypeFilter,
    schoolFilter,
    letterFilter,
    retirementFilter,
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
    setLetterFilter("ALL");
    setRetirementFilter("ALL");
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

  const handleOpenArchive = (employee: EmployeeRecord) => {
    setSelectedArchiveEmployee(employee);
    setArchiveError(null);
    setIsArchiveOpen(true);
  };

  const handleOpenView = (employee: EmployeeRecord) => {
    setSelectedViewEmployee(employee);
    setIsViewOpen(true);
  };

  const handleArchiveConfirm = async (
    password: string,
    archiveReason: string,
  ) => {
    if (!selectedArchiveEmployee) {
      return;
    }

    setIsArchiving(true);
    setArchiveError(null);
    try {
      await archiveEmployee(
        selectedArchiveEmployee.id,
        password,
        archiveReason,
      );
      setIsArchiveOpen(false);
      setShowArchiveSuccess(true);
      await fetchEmployees(false);
    } catch (err) {
      setArchiveError(
        err instanceof Error
          ? err.message
          : "Failed to deactivate employee. Please try again.",
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveSuccessClose = () => {
    setShowArchiveSuccess(false);
    setSelectedArchiveEmployee(null);
  };

  const handleEmployeeUpdated = (updatedEmployee: EmployeeRecord) => {
    setEmployeeData((prev) =>
      prev.map((employee) =>
        employee.id === updatedEmployee.id ? updatedEmployee : employee,
      ),
    );
    setSelectedViewEmployee(updatedEmployee);
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    employeeTypeFilter !== "ALL" ||
    schoolFilter !== "ALL" ||
    letterFilter !== "ALL" ||
    retirementFilter !== "ALL" ||
    sortOrder !== "asc";

  return (
    <div className="w-full min-w-0">
      <div className="grid grid-cols-2 gap-2 mb-4 sm:flex sm:flex-wrap sm:justify-start">
        <button
          onClick={() => setActiveTab("list")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "list"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <Users size={16} />
            Employees Profile
          </span>
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "archived"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <Archive size={16} />
            Inactive Employees
          </span>
        </button>
      </div>

      {activeTab === "list" ? (
        <div className="w-full min-w-0 bg-white rounded-lg shadow-lg p-2 sm:p-3 flex flex-col">
          <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1
              style={{ fontSize: "20px" }}
              className="font-bold text-gray-900 inline-flex items-center gap-2"
            >
              <Users size={22} className="text-blue-600" />
              Employees Profile
            </h1>

            <button
              type="button"
              onClick={() => setIsAddEmployeeOpen(true)}
              className="inline-flex items-center gap-1 px-5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer self-start sm:self-auto"
            >
              <Plus size={14} />
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

            <div className="flex flex-wrap items-center gap-4">
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
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
                      <option key={school.id} value={String(school.id)}>
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
                  value={retirementFilter}
                  onChange={(e) => {
                    setRetirementFilter(
                      e.target.value as "ALL" | "retirable" | "mandatory",
                    );
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="ALL">All</option>
                  <option value="retirable">Retirable</option>
                  <option value="mandatory">Mandatory Retirement</option>
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
                    paginatedEmployees.map((employee) => (
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
                        <p className="mt-1 text-xs text-gray-600 truncate">
                          {employee.email || "N/A"}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {employee.schoolName || "N/A"}
                        </p>

                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenView(employee)}
                            className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition cursor-pointer"
                            aria-label="View employee"
                            title="View"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          {currentUserRole === "SUPER_ADMIN" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenArchive(employee)}
                              className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 transition cursor-pointer"
                              aria-label="Deactivate employee"
                              title="Deactivate"
                            >
                              <UserX size={12} />
                              Deactivate
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))
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
                          Email
                        </th>
                        <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                          School
                        </th>
                        <th className="text-right py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
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
                              <td className="py-1 px-3 text-gray-900 text-sm font-medium">
                                {employee.fullName}
                              </td>
                              <td className="py-1 px-3 text-gray-500 text-sm capitalize">
                                {employee.employeeType}
                              </td>
                              <td className="py-1 px-3 text-gray-500 text-sm">
                                {employee.email || "N/A"}
                              </td>
                              <td className="py-1 px-3 text-gray-500 text-sm">
                                {employee.schoolName || "N/A"}
                              </td>
                              <td className="py-1 px-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenView(employee)}
                                    className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition cursor-pointer"
                                    aria-label="View employee"
                                    title="View"
                                  >
                                    <Eye size={12} />
                                    View
                                  </button>
                                  {currentUserRole === "SUPER_ADMIN" ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenArchive(employee)
                                      }
                                      className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 transition cursor-pointer"
                                      aria-label="Deactivate employee"
                                      title="Deactivate"
                                    >
                                      <UserX size={12} />
                                      Deactivate
                                    </button>
                                  ) : null}
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
        <ArchivedEmployee />
      )}

      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={(employeeName: string) => {
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

      <ViewEmployeeModal
        visible={isViewOpen}
        employee={selectedViewEmployee}
        canEdit={currentUserRole === "SUPER_ADMIN"}
        onEmployeeUpdated={handleEmployeeUpdated}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedViewEmployee(null);
        }}
      />

      <ToastMessage
        isVisible={showAddSuccessToast}
        title="Success"
        message={addSuccessMessage}
        variant="success"
        onClose={() => setShowAddSuccessToast(false)}
        autoCloseDuration={3000}
      />
    </div>
  );
}
