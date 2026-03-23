"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpAZ,
  ArrowDownAZ,
} from "lucide-react";
import UserRolesDetailsModal, {
  type RegistrationDetail,
} from "../../components/UserRolesDetailsModal";
import RoleAssignmentModal from "../../components/RoleAssignmentModal";
import RejectModal from "../../components/RejectModal";

type RegistrationRequest = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  approved_role?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

type PendingAccountsProps = {
  onRefreshUsers?: () => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export default function PendingAccounts({
  onRefreshUsers,
}: PendingAccountsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dateSortOrder, setDateSortOrder] = useState<"newest" | "oldest">(
    "newest",
  );
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [pageJumpInput, setPageJumpInput] = useState("1");
  const [data, setData] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [detailsTarget, setDetailsTarget] = useState<RegistrationDetail | null>(
    null,
  );
  const [assignTarget, setAssignTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Fetch registrations from backend and optionally skip the full-page spinner for polling refreshes.
  const fetchData = async (status: string, showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please login first.");
      }

      const url =
        status === "ALL"
          ? "http://localhost:3000/api/registrations/"
          : `http://localhost:3000/api/registrations/?status=${status}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch registrations");
      }

      const result = await response.json();
      const formattedData = (result.data || []).map((item: any) => ({
        id: item.id,
        firstName: item.first_name,
        lastName: item.last_name,
        email: item.email,
        school: item.school_name,
        approved_role: item.approved_role,
        rejection_reason: item.rejection_reason,
        reviewed_at: item.reviewed_at,
        status: item.status,
        created_at: item.created_at,
      }));
      setData(formattedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) {
        setData([]);
      }
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData(statusFilter);

    const intervalId = window.setInterval(() => {
      fetchData(statusFilter, false);
    }, 5000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredData = data
    .filter((item) => {
      const matchesSearch =
        item.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.school.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLetter =
        letterFilter === "ALL" ||
        item.firstName.charAt(0).toUpperCase() === letterFilter;
      return matchesSearch && matchesLetter;
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

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + itemsPerPage);
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
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 sticky top-4 h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Pending Accounts
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
            <option value="ALL">All</option>
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
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading pending accounts...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Error: {error}</p>
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
                        <button
                          onClick={() =>
                            setDetailsTarget({
                              id: item.id,
                              firstName: item.firstName,
                              lastName: item.lastName,
                              email: item.email,
                              school: item.school,
                              approved_role: item.approved_role,
                              rejection_reason: item.rejection_reason,
                              reviewed_at: item.reviewed_at,
                              status: item.status,
                              created_at: item.created_at,
                            })
                          }
                          className="px-4 py-1.5 bg-blue-400 text-white rounded hover:bg-blue-500 transition text-sm font-medium cursor-pointer"
                        >
                          Details
                        </button>
                        {item.status === "PENDING" ? (
                          <>
                            <button
                              onClick={() =>
                                setAssignTarget({
                                  id: item.id,
                                  name: `${item.firstName} ${item.lastName}`,
                                })
                              }
                              className="px-4 py-1.5 bg-green-400 text-white rounded hover:bg-green-500 transition text-sm font-medium cursor-pointer"
                            >
                              Assign Role
                            </button>
                            <button
                              onClick={() =>
                                setRejectTarget({
                                  id: item.id,
                                  name: `${item.firstName} ${item.lastName}`,
                                })
                              }
                              className="px-4 py-1.5 bg-red-400 text-white rounded hover:bg-red-500 transition text-sm font-medium cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-4 py-1.5 rounded text-sm font-semibold ${
                              item.status === "APPROVED"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.status === "APPROVED"
                              ? "Approved"
                              : "Rejected"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    No pending accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
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

      {/* Modals */}
      {detailsTarget && (
        <UserRolesDetailsModal
          account={detailsTarget}
          onClose={() => setDetailsTarget(null)}
        />
      )}

      {assignTarget && (
        <RoleAssignmentModal
          accountId={assignTarget.id}
          accountName={assignTarget.name}
          onClose={() => setAssignTarget(null)}
          onSuccess={() => {
            setAssignTarget(null);
            fetchData(statusFilter);
            onRefreshUsers?.();
          }}
        />
      )}

      {rejectTarget && (
        <RejectModal
          accountId={rejectTarget.id}
          accountName={rejectTarget.name}
          onClose={() => setRejectTarget(null)}
          onSuccess={() => {
            setRejectTarget(null);
            fetchData(statusFilter);
            onRefreshUsers?.();
          }}
        />
      )}
    </div>
  );
}
