"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpAZ,
  ArrowDownAZ,
  Settings,
  UserPlus,
  UserCheck,
  Eye,
  Search,
} from "lucide-react";
import { UserTableSkeleton } from "../../../components/Skeleton/SkeletonLoaders";
import PendingAccounts from "./PendingAccounts";
import UserSettingModal from "../../components/UserSettingModal";
import UserDetailsEditModal from "../../components/UserDetailsEditModal";
import AddUserModal from "./AddUserModal";
import ToastMessage from "../../../components/ToastMessage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolId: number | null;
  schoolName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  isActive: boolean;
};

type SchoolOption = {
  id: number;
  school_name: string;
};

type UserApiRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school_id?: number | null;
  school_name?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  is_active: unknown;
};

const normalizeIsActive = (value: unknown): boolean => {
  return value === true || value === 1 || value === "1" || value === "true";
};

const normalizeRole = (value: unknown): string => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const USER_ROLES_TAB_KEY = "userRoles:activeTab";

type UserRolesProps = {
  mode?: "super-admin" | "admin";
};

const getInitialUserRolesTab = (): "users" | "pending" => {
  if (typeof window === "undefined") {
    return "users";
  }

  const storedTab = window.localStorage.getItem(USER_ROLES_TAB_KEY);
  if (storedTab === "pending") {
    window.localStorage.removeItem(USER_ROLES_TAB_KEY);
    return "pending";
  }

  return "users";
};

export default function UserRoles({ mode = "super-admin" }: UserRolesProps) {
  const isAdminMode = mode === "admin";
  const [activeTab, setActiveTab] = useState<"users" | "pending">(
    getInitialUserRolesTab,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [accountStatusFilter, setAccountStatusFilter] = useState<
    "ACTIVE" | "INACTIVE" | "ALL"
  >("ACTIVE");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageJumpInput, setPageJumpInput] = useState("1");
  const [userData, setUserData] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [detailsTargetId, setDetailsTargetId] = useState<number | null>(null);
  const [detailsEditTarget, setDetailsEditTarget] = useState<User | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<User | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [currentUserSchoolId, setCurrentUserSchoolId] = useState<number | null>(
    null,
  );
  const [schoolFilter, setSchoolFilter] = useState<string>("ALL");
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [toastState, setToastState] = useState<{
    isVisible: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({
    isVisible: false,
    variant: "success",
    title: "",
    message: "",
  });
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const showToast = (
    variant: "success" | "error",
    title: string,
    message: string,
  ) => {
    setToastState({
      isVisible: true,
      variant,
      title,
      message,
    });
  };

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) return;

      const parsed = JSON.parse(rawUser) as {
        role?: string;
        school_id?: number | string | null;
        schoolId?: number | string | null;
      };
      setCurrentUserRole(normalizeRole(parsed.role));
      const schoolId = Number(parsed.school_id ?? parsed.schoolId);
      setCurrentUserSchoolId(
        Number.isFinite(schoolId) && schoolId > 0 ? schoolId : null,
      );
    } catch {
      setCurrentUserRole("");
      setCurrentUserSchoolId(null);
    }
  }, []);

  useEffect(() => {
    const fetchSchools = async () => {
      if (currentUserRole !== "SUPER_ADMIN") {
        setSchoolFilter("ALL");
        setSchools([]);
        return;
      }

      try {
        setSchoolsLoading(true);
        const response = await fetch(`${API_BASE}/api/schools/public/list`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch schools");
        }

        const result = await response.json();
        setSchools((result.data || []) as SchoolOption[]);
      } catch {
        setSchools([]);
      } finally {
        setSchoolsLoading(false);
      }
    };

    fetchSchools();
  }, [currentUserRole]);

  const fetchUsers = async (
    showSpinner = true,
    overrides: { page?: number; pageSize?: number } = {},
  ) => {
    try {
      if (showSpinner) {
        setUserLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter && roleFilter !== "ALL") params.set("role", roleFilter);
      if (accountStatusFilter && accountStatusFilter !== "ALL") {
        params.set("is_active", accountStatusFilter === "ACTIVE" ? "1" : "0");
      }
      if (currentUserRole === "SUPER_ADMIN" && schoolFilter !== "ALL") {
        params.set("school_id", schoolFilter);
      }
      if (letterFilter !== "ALL") params.set("letter", letterFilter);
      if (sortOrder) params.set("sortOrder", sortOrder);
      const nextPage = overrides.page ?? currentPage;
      const nextPageSize = overrides.pageSize ?? itemsPerPage;
      params.set("page", String(nextPage));
      params.set("pageSize", String(nextPageSize));

      const response = await fetch(
        `${API_BASE}/api/users/?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch users");

      const result = await response.json();
      const rows = (result.data || []) as UserApiRow[];
      const formatted = rows.map((item) => ({
        id: item.id,
        firstName: item.first_name,
        lastName: item.last_name,
        email: item.email,
        schoolId: item.school_id ?? null,
        schoolName: item.school_name || "N/A",
        role: item.role,
        isActive: normalizeIsActive(item.is_active),
      }));
      const resultTotal = (result as { total?: number }).total;
      setUserData(formatted);
      setTotalItems(
        typeof resultTotal === "number" ? resultTotal : formatted.length,
      );
      setUserError(null);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) {
        setUserData([]);
        setTotalItems(0);
      }
    } finally {
      if (showSpinner) {
        setUserLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [
    isAdminMode,
    currentUserRole,
    currentUserSchoolId,
    schoolFilter,
    currentPage,
    itemsPerPage,
    roleFilter,
    accountStatusFilter,
    letterFilter,
    sortOrder,
    settingsTarget,
    detailsTargetId,
    detailsEditTarget,
    showAddUserModal,
  ]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(true, { page: 1, pageSize: itemsPerPage });
    }, 350);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredUsers = userData;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedUsers = filteredUsers;
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
    fetchUsers(true, { page: 1, pageSize: itemsPerPage });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setAccountStatusFilter("ACTIVE");
    setSchoolFilter("ALL");
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
    roleFilter !== "ALL" ||
    accountStatusFilter !== "ACTIVE" ||
    schoolFilter !== "ALL" ||
    letterFilter !== "ALL" ||
    sortOrder !== "asc";

  return (
    <div className="w-full">
      <ToastMessage
        isVisible={toastState.isVisible}
        variant={toastState.variant}
        title={toastState.title}
        message={toastState.message}
        position="top-right"
        autoCloseDuration={2600}
        onClose={() =>
          setToastState((prev) => ({
            ...prev,
            isVisible: false,
          }))
        }
      />

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row justify-start gap-2 mb-4">
        <button
          onClick={() => setActiveTab("users")}
          className={`w-full sm:w-auto px-4 py-1 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "users"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Settings size={16} />
            User & Roles
          </span>
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`w-full sm:w-auto px-4 py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "pending"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <UserCheck size={16} />
            Pending Accounts
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <div className="w-full min-w-0 bg-white rounded-lg shadow-lg p-2 sm:p-3 flex flex-col border border-gray-100">
          <h1
            style={{ fontSize: "20px" }}
            className="font-bold text-gray-900 mb-4 inline-flex items-center gap-2"
          >
            <Settings size={24} className="text-blue-600" />
            {isAdminMode ? "User & Roles (Admin Only)" : "User & Roles"}
          </h1>

          {/* Header with search and controls */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Search and Status Row */}
            <div className="flex flex-col gap-2 min-w-0 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  placeholder="Search name, email, or school"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-gray-500 w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                className="inline-flex w-full shrink-0 sm:w-auto items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap"
              >
                <Search size={14} />
                Search
              </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-start">
              <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-row lg:items-center">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer whitespace-nowrap shrink-0"
                >
                  <UserPlus size={14} />
                  Add User
                </button>

                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-gray-500 w-full sm:w-auto sm:min-w-36 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="DATA_ENCODER">Data Encoder</option>
                  {!isAdminMode && (
                    <option value="SUPER_ADMIN">Super Admin</option>
                  )}
                </select>

                {currentUserRole === "SUPER_ADMIN" && (
                  <select
                    value={schoolFilter}
                    onChange={(e) => {
                      setSchoolFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-auto sm:min-w-48 lg:max-w-[18rem] text-gray-500 px-3 py-2 sm:py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                    disabled={schoolsLoading}
                  >
                    <option value="ALL">All Schools</option>
                    {schools.map((school) => (
                      <option key={school.id} value={String(school.id)}>
                        {school.school_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-row lg:items-center">
                <select
                  value={accountStatusFilter}
                  onChange={(e) => {
                    setAccountStatusFilter(
                      e.target.value as "ACTIVE" | "INACTIVE" | "ALL",
                    );
                    setCurrentPage(1);
                  }}
                  className="text-gray-500 w-full sm:w-auto sm:min-w-42 px-3 py-2 sm:py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="ACTIVE">Active Accounts</option>
                  <option value="INACTIVE">Inactive Accounts</option>
                  <option value="ALL">All Accounts</option>
                </select>

                <select
                  value={letterFilter}
                  onChange={(e) => {
                    setLetterFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-gray-500 w-full sm:w-auto sm:min-w-34 px-3 py-2 sm:py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
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
                  className="text-gray-500 flex items-center justify-center gap-2 px-3 py-2 sm:py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium cursor-pointer whitespace-nowrap shrink-0"
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
                    className="text-sm text-gray-500 underline hover:text-gray-700 transition cursor-pointer lg:self-center"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto overflow-y-auto max-h-[42vh] sm:max-h-[50vh]">
            {userLoading ? (
              <UserTableSkeleton rows={5} />
            ) : userError ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-red-500">Error: {userError}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-blue-100">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                      Name
                    </th>
                    <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                      Email
                    </th>
                    <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                      Role
                    </th>
                    <th className="text-center py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                      Status
                    </th>
                    <th className="text-right py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="py-1 px-3 text-gray-900 text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="py-0.5 px-3 text-gray-500 text-sm">
                          {user.email}
                        </td>
                        <td className="py-0.5 px-3 text-gray-500 text-sm">
                          {user.role.replace(/_/g, " ")}
                        </td>
                        <td className="py-0.5 px-3 text-center">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-0.5 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDetailsTargetId(user.id)}
                              className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-pointer"
                              aria-label={`View details for ${user.firstName} ${user.lastName}`}
                              title="View details"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => {
                                if (isAdminMode) {
                                  setSettingsTarget(user);
                                  return;
                                }

                                setDetailsEditTarget(user);
                              }}
                              disabled={
                                isAdminMode &&
                                (user.role === "SUPER_ADMIN" ||
                                  user.role === "ADMIN")
                              }
                              className={`p-1.5 rounded transition ${
                                isAdminMode &&
                                (user.role === "SUPER_ADMIN" ||
                                  user.role === "ADMIN")
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
                              }`}
                              aria-label={
                                isAdminMode &&
                                (user.role === "SUPER_ADMIN" ||
                                  user.role === "ADMIN")
                                  ? `Settings disabled for ${user.firstName} ${user.lastName}`
                                  : isAdminMode
                                    ? `Open settings for ${user.firstName} ${user.lastName}`
                                    : `Edit details for ${user.firstName} ${user.lastName}`
                              }
                              title={
                                isAdminMode &&
                                (user.role === "SUPER_ADMIN" ||
                                  user.role === "ADMIN")
                                  ? "Settings disabled for Admin and Super Admin"
                                  : isAdminMode
                                    ? "User settings"
                                    : "Edit user details"
                              }
                            >
                              <Settings size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="mt-6">
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
                    className="p-2 text-gray-500 hover:bg-gray-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
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
                            : "text-gray-500 hover:bg-gray-50"
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
                    className="p-2 text-gray-500 hover:bg-gray-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
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
      )}

      {/* Pending Accounts Tab */}
      {activeTab === "pending" && (
        <PendingAccounts onRefreshUsers={() => fetchUsers(false)} />
      )}

      {detailsTargetId && (
        <UserDetailsModalInline
          userId={detailsTargetId}
          onClose={() => setDetailsTargetId(null)}
        />
      )}

      {detailsEditTarget && (
        <UserDetailsEditModal
          userId={detailsEditTarget.id}
          onClose={() => setDetailsEditTarget(null)}
          onSuccess={(message) => {
            fetchUsers(false);
            showToast(
              "success",
              "User Updated",
              message || "User details updated successfully.",
            );
          }}
          onError={(message) => {
            showToast("error", "Update Failed", message);
          }}
          onOpenAccountSettings={() => {
            const target = detailsEditTarget;
            if (!target) return;
            setDetailsEditTarget(null);
            setSettingsTarget(target);
          }}
        />
      )}

      {settingsTarget && (
        <UserSettingModal
          userId={settingsTarget.id}
          userName={`${settingsTarget.firstName} ${settingsTarget.lastName}`}
          initialRole={settingsTarget.role}
          initialIsActive={settingsTarget.isActive}
          onClose={() => setSettingsTarget(null)}
          onSuccess={(message) => {
            setSettingsTarget(null);
            fetchUsers(false);
            showToast(
              "success",
              "Settings Updated",
              message || "User settings updated successfully.",
            );
          }}
          onError={(message) => {
            showToast("error", "Update Failed", message);
          }}
        />
      )}

      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSuccess={() => {
            setShowAddUserModal(false);
            fetchUsers(false);
          }}
        />
      )}
    </div>
  );
}

type UserDetails = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school_name?: string | null;
  school_code?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  is_active: boolean | number;
  created_at?: string;
  updated_at?: string;
};

type UserDetailsResponse = {
  data?: UserDetails;
};

function UserDetailsModalInline({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found.");

        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.message || "Failed to fetch user details.");
        }

        const result = (await response.json()) as UserDetailsResponse;
        if (!result.data) {
          throw new Error("User details not found.");
        }

        setUser(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [userId]);

  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl border border-blue-200 shadow-2xl w-full max-w-md mx-4 p-6 relative">
        <h2 className="text-xl font-bold text-gray-800 mb-5">User Details</h2>

        {loading ? (
          <p className="text-sm text-gray-500">Loading details...</p>
        ) : error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        ) : user ? (
          <div className="space-y-3">
            <DetailsRow
              label="Full Name"
              value={`${user.first_name} ${user.last_name}`}
            />
            <DetailsRow label="Email" value={user.email} />
            <DetailsRow label="School" value={user.school_name || "N/A"} />
            <DetailsRow label="Role" value={user.role.replace(/_/g, " ")} />
            <DetailsRow
              label="Status"
              value={normalizeIsActive(user.is_active) ? "Active" : "Inactive"}
            />
            <DetailsRow
              label="Created At"
              value={formatDate(user.created_at)}
            />
            <DetailsRow
              label="Updated At"
              value={formatDate(user.updated_at)}
            />
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-gray-100 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-sm font-medium text-gray-500 shrink-0 sm:mr-4">
        {label}
      </span>
      <span className="text-sm text-gray-800 text-left sm:text-right wrap-break-word">
        {value}
      </span>
    </div>
  );
}
