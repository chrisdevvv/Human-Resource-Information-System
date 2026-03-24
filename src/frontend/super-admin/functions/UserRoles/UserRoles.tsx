"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpAZ,
  ArrowDownAZ,
  Settings,
} from "lucide-react";
import PendingAccounts from "./PendingAccounts";
import UserSettingModal from "../../components/UserSettingModal";
import AddUserModal from "./AddUserModal";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  isActive: boolean;
};

const normalizeIsActive = (value: unknown): boolean => {
  return value === true || value === 1 || value === "1" || value === "true";
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export default function UserRoles() {
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
  const [pageJumpInput, setPageJumpInput] = useState("1");
  const [userData, setUserData] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [detailsTargetId, setDetailsTargetId] = useState<number | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<User | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const fetchUsers = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setUserLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch(`${API_BASE}/api/users/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const result = await response.json();
      const formatted = (result.data || []).map((item: any) => ({
        id: item.id,
        firstName: item.first_name,
        lastName: item.last_name,
        email: item.email,
        schoolName: item.school_name || "N/A",
        role: item.role,
        isActive: normalizeIsActive(item.is_active),
      }));
      setUserData(formatted);
      setUserError(null);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) {
        setUserData([]);
      }
    } finally {
      if (showSpinner) {
        setUserLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers();

    const intervalId = window.setInterval(() => {
      fetchUsers(false);
    }, 5000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = userData
    .filter((user) => {
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesAccountStatus =
        accountStatusFilter === "ALL" ||
        (accountStatusFilter === "ACTIVE" ? user.isActive : !user.isActive);
      const matchesLetter =
        letterFilter === "ALL" ||
        user.firstName.charAt(0).toUpperCase() === letterFilter;
      return (
        matchesSearch && matchesRole && matchesAccountStatus && matchesLetter
      );
    })
    .sort((a, b) => {
      if (sortOrder === "asc") return a.firstName.localeCompare(b.firstName);
      return b.firstName.localeCompare(a.firstName);
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage),
  );
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIdx, startIdx + itemsPerPage);
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
          User & Roles
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-6 py-2 font-medium text-sm rounded-t-lg transition cursor-pointer ${
            activeTab === "pending"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Pending Accounts
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 sticky top-4 h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            User & Roles
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer"
                >
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
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="DATA_ENCODER">Data Encoder</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                  className="text-gray-500 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
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
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
            {userLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : userError ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">Error: {userError}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                      Name
                    </th>
                    <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                      Email
                    </th>
                    <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                      Role
                    </th>
                    <th className="text-center py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                      Status
                    </th>
                    <th className="text-right py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
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
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-xs font-semibold cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => setSettingsTarget(user)}
                              className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition cursor-pointer"
                              aria-label={`Open settings for ${user.firstName} ${user.lastName}`}
                              title="User settings"
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
        <PendingAccounts onRefreshUsers={() => fetchUsers(false)} />
      )}

      {detailsTargetId && (
        <UserDetailsModalInline
          userId={detailsTargetId}
          onClose={() => setDetailsTargetId(null)}
        />
      )}

      {settingsTarget && (
        <UserSettingModal
          userId={settingsTarget.id}
          userName={`${settingsTarget.firstName} ${settingsTarget.lastName}`}
          initialRole={settingsTarget.role}
          initialIsActive={settingsTarget.isActive}
          onClose={() => setSettingsTarget(null)}
          onSuccess={() => {
            setSettingsTarget(null);
            fetchUsers(false);
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
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
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm cursor-pointer"
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
    <div className="flex justify-between items-start py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-500 shrink-0 mr-4">
        {label}
      </span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  );
}
