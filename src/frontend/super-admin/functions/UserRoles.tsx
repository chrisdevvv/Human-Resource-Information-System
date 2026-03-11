"use client";

import React, { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpAZ,
  ArrowDownAZ,
} from "lucide-react";
import PendingAccounts from "./PendingAccounts";

type RegistrationRequest = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  requested_role: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

export default function UserRoles() {
  const [activeTab, setActiveTab] = useState<"users" | "pending">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dateSortOrder, setDateSortOrder] = useState<"newest" | "oldest">(
    "newest",
  );
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Mock data - will connect to backend later
  const mockData: RegistrationRequest[] = [];

  const filteredData = mockData
    .filter((item) => {
      const matchesSearch =
        item.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.school.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = item.status === statusFilter;
      const matchesLetter =
        letterFilter === "ALL" ||
        item.firstName.charAt(0).toUpperCase() === letterFilter;
      return matchesSearch && matchesStatus && matchesLetter;
    })
    .sort((a, b) => {
      // First sort by date
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      if (dateSortOrder === "newest") {
        if (dateB !== dateA) return dateB - dateA;
      } else {
        if (dateA !== dateB) return dateA - dateB;
      }

      // Then sort by name if dates are equal
      if (sortOrder === "asc") {
        return a.firstName.localeCompare(b.firstName);
      } else {
        return b.firstName.localeCompare(a.firstName);
      }
    });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex justify-end gap-2 mb-4">
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
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
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

              {/* Date Sort Filter */}
              <select
                value={dateSortOrder}
                onChange={(e) => {
                  setDateSortOrder(e.target.value as "newest" | "oldest");
                  setCurrentPage(1);
                }}
                className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
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
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                    Name
                  </th>
                  <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                    Email
                  </th>
                  <th className="text-center py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-1 px-3 text-gray-900 text-sm font-medium">
                        {item.firstName} {item.lastName}
                      </td>
                      <td className="py-1 px-3 text-gray-500 text-sm">
                        {item.email}
                      </td>
                      <td className="py-1 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <button className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium cursor-pointer">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No registration requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
      {activeTab === "pending" && <PendingAccounts />}
    </div>
  );
}
