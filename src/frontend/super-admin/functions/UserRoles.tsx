"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpAZ,
  ArrowDownAZ,
} from "lucide-react";
import PendingAccounts from "./PendingAccounts";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  isActive: boolean;
};

export default function UserRoles() {
  const [activeTab, setActiveTab] = useState<"users" | "pending">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [userData, setUserData] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const itemsPerPage = 10;

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const fetchUsers = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setUserLoading(true);
      }

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
      const formatted = (result.data || []).map((item: any) => ({
        id: item.id,
        firstName: item.first_name,
        lastName: item.last_name,
        email: item.email,
        schoolName: item.school_name || "N/A",
        role: item.role,
        isActive: Boolean(item.is_active),
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
      const matchesLetter =
        letterFilter === "ALL" ||
        user.firstName.charAt(0).toUpperCase() === letterFilter;
      return matchesSearch && matchesRole && matchesLetter;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") return a.firstName.localeCompare(b.firstName);
      return b.firstName.localeCompare(a.firstName);
    });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIdx, startIdx + itemsPerPage);

  const handleSearch = () => {
    setCurrentPage(1);
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Role Filter */}
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

              {/* Alphabet Filter */}
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

              {/* Sort Button */}
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded font-medium text-sm transition cursor-pointer ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {page}
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
          )}
        </div>
      )}

      {/* Pending Accounts Tab */}
      {activeTab === "pending" && (
        <PendingAccounts onRefreshUsers={() => fetchUsers(false)} />
      )}
    </div>
  );
}
