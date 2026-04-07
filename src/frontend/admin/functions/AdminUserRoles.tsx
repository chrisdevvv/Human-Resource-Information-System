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
  X,
  Eye,
} from "lucide-react";
import AdminPendingAccounts from "./AdminPendingAccounts";
import AdminAddUserModal from "./AdminAddUserModal";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  isActive: boolean;
};

type EditableUserRole = "ADMIN" | "DATA_ENCODER";
type EditableUser = Omit<User, "role"> & { role: EditableUserRole };

type UserApiRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school_name?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  is_active: unknown;
};

const normalizeIsActive = (value: unknown): boolean => {
  return value === true || value === 1 || value === "1" || value === "true";
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export default function AdminUserRoles() {
  const [activeTab, setActiveTab] = useState<"users" | "pending">("users");
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
  const [settingsTarget, setSettingsTarget] = useState<EditableUser | null>(
    null,
  );
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const fetchUsers = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setUserLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter && roleFilter !== "ALL") params.set("role", roleFilter);
      if (accountStatusFilter && accountStatusFilter !== "ALL")
        params.set("is_active", accountStatusFilter === "ACTIVE" ? "1" : "0");
      params.set("page", String(currentPage));
      params.set("pageSize", String(itemsPerPage));

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

      // When pagination is used backend returns { data, total, page, pageSize }
      const rows = (result.data || []) as UserApiRow[];
      const formatted = rows.map((item) => ({
        id: item.id,
        firstName: item.first_name,
        lastName: item.last_name,
        email: item.email,
        schoolName: item.school_name || "N/A",
        role: item.role,
        isActive: normalizeIsActive(item.is_active),
      }));

      setUserData(formatted);
      setTotalItems(
        typeof result.total === "number" ? result.total : formatted.length,
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
    // initial load
    fetchUsers();

    const intervalId = window.setInterval(() => {
      fetchUsers(false);
    }, 5000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when page, pageSize, role, or account status change
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, roleFilter, accountStatusFilter]);

  // Debounce search input
  useEffect(() => {
    const id = window.setTimeout(() => {
      setCurrentPage(1);
      fetchUsers();
    }, 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // userData is already server-paginated. Apply only letter filter and sorting locally.
  const filteredUsers = userData
    .filter((user) => {
      const matchesLetter =
        letterFilter === "ALL" ||
        user.firstName.charAt(0).toUpperCase() === letterFilter;
      return matchesLetter;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") return a.firstName.localeCompare(b.firstName);
      return b.firstName.localeCompare(a.firstName);
    });

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedUsers = filteredUsers; // already paginated by server
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
    <div className="w-full">
      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-2 font-medium text-sm rounded-t-lg transition cursor-pointer ${
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
          className={`px-6 py-2 font-medium text-sm rounded-t-lg transition cursor-pointer ${
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
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 sticky top-4 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 inline-flex items-center gap-2">
            <Settings size={24} className="text-blue-600" />
            User & Roles (Admin Only)
          </h1>

          {/* Header with search and controls */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Search and Status Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search name, email, or school"
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

            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer"
                >
                  <UserPlus size={16} />
                  Add User
                </button>

                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="DATA_ENCODER">Data Encoder</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                  value={accountStatusFilter}
                  onChange={(e) => {
                    setAccountStatusFilter(
                      e.target.value as "ACTIVE" | "INACTIVE" | "ALL",
                    );
                    setCurrentPage(1);
                  }}
                  className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
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
                  className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
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
                  className="text-gray-500 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
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

          {/* Table */}
          <div className="overflow-x-auto overflow-y-auto max-h-[42vh] sm:max-h-[50vh]">
            {userLoading ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : userError ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-red-500">Error: {userError}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-blue-100">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-blue-100">
                      Name
                    </th>
                    <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-blue-100">
                      Email
                    </th>
                    <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-blue-100">
                      Role
                    </th>
                    <th className="text-center py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-blue-100">
                      Status
                    </th>
                    <th className="text-right py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-blue-100">
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
                        <td className="py-1 px-3 text-gray-500 text-sm">
                          {user.email}
                        </td>
                        <td className="py-1 px-3 text-gray-500 text-sm">
                          {user.role.replace(/_/g, " ")}
                        </td>
                        <td className="py-1 px-3 text-center">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-1 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDetailsTargetId(user.id)}
                              className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-pointer"
                              aria-label={`View details for ${user.firstName} ${user.lastName}`}
                              title="View details"
                            >
                              <Eye size={14} />
                            </button>
                            {/** Admin and super admin accounts are visible but cannot be edited by admin. */}
                            <button
                              onClick={() => {
                                if (
                                  user.role === "SUPER_ADMIN" ||
                                  user.role === "ADMIN"
                                ) {
                                  return;
                                }
                                const editableUser: EditableUser = {
                                  ...user,
                                  role: user.role,
                                };
                                setSettingsTarget(editableUser);
                              }}
                              disabled={
                                user.role === "SUPER_ADMIN" ||
                                user.role === "ADMIN"
                              }
                              className={`p-2 rounded transition ${
                                user.role === "SUPER_ADMIN" ||
                                user.role === "ADMIN"
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
                              }`}
                              aria-label={
                                user.role === "SUPER_ADMIN" ||
                                user.role === "ADMIN"
                                  ? `Settings disabled for ${user.firstName} ${user.lastName}`
                                  : `Open settings for ${user.firstName} ${user.lastName}`
                              }
                              title={
                                user.role === "SUPER_ADMIN" ||
                                user.role === "ADMIN"
                                  ? "Settings disabled for Admin and Super Admin"
                                  : "User settings"
                              }
                            >
                              <Settings size={14} />
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
      )}

      {/* Pending Accounts Tab */}
      {activeTab === "pending" && (
        <AdminPendingAccounts onRefreshUsers={() => fetchUsers(false)} />
      )}

      {detailsTargetId && (
        <AdminUserDetailsModal
          userId={detailsTargetId}
          onClose={() => setDetailsTargetId(null)}
        />
      )}

      {/* Admin User Settings Modal */}
      {settingsTarget && (
        <AdminUserSettingModal
          userId={settingsTarget.id}
          userName={`${settingsTarget.firstName} ${settingsTarget.lastName}`}
          initialRole={settingsTarget.role}
          onClose={() => setSettingsTarget(null)}
          onSuccess={() => {
            setSettingsTarget(null);
            fetchUsers(false);
          }}
        />
      )}

      {showAddUserModal && (
        <AdminAddUserModal
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

type AdminUserSettingModalProps = {
  userId: number;
  userName: string;
  initialRole: EditableUserRole;
  onClose: () => void;
  onSuccess: () => void;
};

type AdminUserDetails = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school_name?: string | null;
  school_code?: string | null;
  role: User["role"];
  is_active: boolean | number;
  created_at?: string;
  updated_at?: string;
};

type AdminUserDetailsResponse = {
  data?: AdminUserDetails;
};

function AdminUserDetailsModal({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const [user, setUser] = useState<AdminUserDetails | null>(null);
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

        const result = (await response.json()) as AdminUserDetailsResponse;
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
            <AdminDetailsRow
              label="Full Name"
              value={`${user.first_name} ${user.last_name}`}
            />
            <AdminDetailsRow label="Email" value={user.email} />
            <AdminDetailsRow label="School" value={user.school_name || "N/A"} />
            <AdminDetailsRow
              label="Role"
              value={user.role.replace(/_/g, " ")}
            />
            <AdminDetailsRow
              label="Status"
              value={normalizeIsActive(user.is_active) ? "Active" : "Inactive"}
            />
            <AdminDetailsRow
              label="Created At"
              value={formatDate(user.created_at)}
            />
            <AdminDetailsRow
              label="Updated At"
              value={formatDate(user.updated_at)}
            />
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminDetailsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-500 shrink-0 mr-4">
        {label}
      </span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  );
}

type UserDetailsResponse = {
  data?: {
    role?: User["role"];
  };
};

function AdminUserSettingModal({
  userId,
  userName,
  initialRole,
  onClose,
  onSuccess,
}: AdminUserSettingModalProps) {
  const [selectedRole, setSelectedRole] =
    useState<EditableUserRole>(initialRole);
  const [currentRole, setCurrentRole] = useState<EditableUserRole>(initialRole);
  const isDataEncoder = currentRole === "DATA_ENCODER";
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoadingUser(true);
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
        const roleFromApi = result.data?.role;

        if (roleFromApi && roleFromApi !== "SUPER_ADMIN") {
          setCurrentRole(roleFromApi);
          setSelectedRole(roleFromApi);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const handleSaveRole = async () => {
    if (selectedRole === currentRole) {
      setError("No role changes detected.");
      return;
    }

    try {
      setSavingRole(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch(`${API_BASE}/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Failed to update role.");
      }

      setCurrentRole(selectedRole);
      setConfirmRoleChange(false);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSavingRole(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl border border-blue-200 shadow-2xl w-full max-w-md mx-4 p-6">
          <p className="text-sm text-gray-500">Loading user settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl border border-blue-200 shadow-2xl w-full max-w-md mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label="Close settings modal"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-1">User Settings</h2>
        <p className="text-sm text-gray-500 mb-5">
          Manage account for {userName}
        </p>

        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Role
          </label>
          <p className="text-xs text-gray-500 mb-2 italic">
            Note: Admins can only assign Data Encoder role
          </p>
          <select
            value={selectedRole}
            onChange={(e) =>
              setSelectedRole(e.target.value as EditableUserRole)
            }
            disabled={savingRole || isDataEncoder}
            className="text-gray-600 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="DATA_ENCODER">Data Encoder</option>
            {currentRole === "ADMIN" && <option value="ADMIN">Admin</option>}
          </select>
          <button
            onClick={() => {
              if (isDataEncoder) {
                return;
              }
              setError(null);
              setConfirmRoleChange(true);
            }}
            disabled={savingRole || isDataEncoder}
            className={`mt-3 w-full px-4 py-2 rounded-lg transition font-medium text-sm disabled:opacity-60 ${
              isDataEncoder
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            }`}
          >
            Save Role
          </button>
          {isDataEncoder && (
            <p className="text-xs text-gray-500 mt-2">
              Note: For deactivating or reactivating a Data Encoder account,
              please contact the Super Admin directly.
            </p>
          )}
        </div>

        {confirmRoleChange && (
          <ConfirmationModal
            title="Confirm Role Change"
            message={`Change role from ${currentRole} to ${selectedRole}?`}
            onConfirm={handleSaveRole}
            onCancel={() => setConfirmRoleChange(false)}
            loading={savingRole}
          />
        )}
      </div>
    </div>
  );
}

type ConfirmationModalProps = {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

function ConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg border border-blue-200 shadow-lg w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-60"
          >
            {loading ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
