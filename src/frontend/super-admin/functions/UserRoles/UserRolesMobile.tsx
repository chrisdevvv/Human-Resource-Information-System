"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpAZ,
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import PendingAccountsMobile from "./PendingAccountsMobile";
import UserSettingModal from "../../components/UserSettingModal";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  isActive: boolean;
};

type UserDetails = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school_name?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  is_active: boolean | number;
  created_at?: string;
  updated_at?: string;
};

type UserDetailsResponse = {
  data?: UserDetails;
};

const normalizeIsActive = (value: unknown): boolean => {
  return value === true || value === 1 || value === "1" || value === "true";
};

export default function UserRolesMobile() {
  const [activeTab, setActiveTab] = useState<"users" | "pending">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [accountStatusFilter, setAccountStatusFilter] = useState<
    "ACTIVE" | "INACTIVE" | "ALL"
  >("ACTIVE");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [userData, setUserData] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<User | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<User | null>(null);
  const itemsPerPage = 10;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const fetchUsers = async (showSpinner = true) => {
    try {
      if (showSpinner) setUserLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch("http://localhost:3000/api/users/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const result = await response.json();
      const formatted = (result.data || []).map(
        (item: Record<string, unknown>) => ({
          id: item.id as number,
          firstName: item.first_name as string,
          lastName: item.last_name as string,
          email: item.email as string,
          schoolName: (item.school_name as string) || "N/A",
          role: item.role as User["role"],
          isActive: normalizeIsActive(item.is_active),
        }),
      );
      setUserData(formatted);
      setUserError(null);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) setUserData([]);
    } finally {
      if (showSpinner) setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const intervalId = window.setInterval(() => fetchUsers(false), 5000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = userData
    .filter((user) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        user.firstName.toLowerCase().includes(q) ||
        user.lastName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.schoolName.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus =
        accountStatusFilter === "ALL" ||
        (accountStatusFilter === "ACTIVE" ? user.isActive : !user.isActive);
      const matchesLetter =
        letterFilter === "ALL" ||
        user.firstName.charAt(0).toUpperCase() === letterFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesLetter;
    })
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.firstName.localeCompare(b.firstName)
        : b.firstName.localeCompare(a.firstName),
    );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="w-full px-3 py-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
            activeTab === "users"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          User &amp; Roles
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
            activeTab === "pending"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Pending Accounts
        </button>
      </div>

      {/* Users tab */}
      {activeTab === "users" && (
        <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col gap-4">
          <h1 className="text-lg font-bold text-gray-900">User &amp; Roles</h1>

          {/* Filters */}
          <div className="flex flex-col gap-2">
            {/* Search */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search name, email, or school"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setCurrentPage(1)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                Search
              </button>
            </div>

            {/* Dropdowns 2×2 grid */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="DATA_ENCODER">Data Encoder</option>
              </select>

              <select
                value={accountStatusFilter}
                onChange={(e) => {
                  setAccountStatusFilter(
                    e.target.value as "ACTIVE" | "INACTIVE" | "ALL",
                  );
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ALL">All Status</option>
              </select>

              <select
                value={letterFilter}
                onChange={(e) => {
                  setLetterFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Letters</option>
                {alphabet.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition cursor-pointer"
              >
                {sortOrder === "asc" ? (
                  <>
                    <ArrowUpAZ size={15} />
                    A–Z
                  </>
                ) : (
                  <>
                    <ArrowDownAZ size={15} />
                    Z–A
                  </>
                )}
              </button>
            </div>
          </div>

          {/* User list */}
          {userLoading ? (
            <p className="text-center text-sm text-gray-500 py-8">
              Loading users...
            </p>
          ) : userError ? (
            <p className="text-center text-sm text-red-500 py-8">
              Error: {userError}
            </p>
          ) : paginatedUsers.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No users found.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewTarget(user)}
                    className="ml-3 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition cursor-pointer shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 mt-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft size={15} />
                Prev
              </button>

              <span className="text-sm text-gray-500">
                Page{" "}
                <span className="font-semibold text-gray-800">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {totalPages}
                </span>
              </span>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending Accounts tab */}
      {activeTab === "pending" && (
        <PendingAccountsMobile onRefreshUsers={() => fetchUsers(false)} />
      )}

      {/* Details bottom sheet */}
      {viewTarget && (
        <UserDetailsMobileModal
          userId={viewTarget.id}
          onClose={() => setViewTarget(null)}
          onOpenSettings={() => {
            const target = viewTarget;
            setViewTarget(null);
            setSettingsTarget(target);
          }}
        />
      )}

      {/* Settings modal */}
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Details bottom-sheet modal                                           */
/* ------------------------------------------------------------------ */

function UserDetailsMobileModal({
  userId,
  onClose,
  onOpenSettings,
}: {
  userId: number;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found.");

        const response = await fetch(
          `http://localhost:3000/api/users/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.message || "Failed to fetch user details.");
        }

        const result = (await response.json()) as UserDetailsResponse;
        if (!result.data) throw new Error("User details not found.");
        setDetails(result.data);
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-6 pt-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">User Details</h2>

          {loading ? (
            <p className="text-sm text-gray-500 py-6 text-center">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          ) : details ? (
            <div className="space-y-0">
              <MRow
                label="Full Name"
                value={`${details.first_name} ${details.last_name}`}
              />
              <MRow label="Email" value={details.email} />
              <MRow label="School" value={details.school_name || "N/A"} />
              <MRow label="Role" value={details.role.replace(/_/g, " ")} />
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">
                  Status
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    normalizeIsActive(details.is_active)
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {normalizeIsActive(details.is_active) ? "Active" : "Inactive"}
                </span>
              </div>
              <MRow label="Created At" value={formatDate(details.created_at)} />
              <MRow label="Updated At" value={formatDate(details.updated_at)} />
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onOpenSettings}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
            >
              <Settings size={14} />
              Settings
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-500 shrink-0 mr-4">
        {label}
      </span>
      <span className="text-sm text-gray-800 text-right break-all">
        {value}
      </span>
    </div>
  );
}
