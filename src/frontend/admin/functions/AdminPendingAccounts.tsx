"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCheck,
} from "lucide-react";
import UserRolesDetailsModal, {
  type RegistrationDetail,
} from "../../super-admin/components/UserRolesDetailsModal";
import RejectModal from "../../super-admin/components/RejectModal";
import AdminRoleAssignmentModal from "./AdminRoleAssignmentModal";

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

type RegistrationApiRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school_name: string;
  approved_role?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

type AdminPendingAccountsProps = {
  onRefreshUsers?: () => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function AdminPendingAccounts({
  onRefreshUsers,
}: AdminPendingAccountsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dateSortOrder, setDateSortOrder] = useState<"newest" | "oldest">(
    "newest",
  );
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageJumpInput, setPageJumpInput] = useState("1");
  const [data, setData] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchData = async (
    status: string,
    page = currentPage,
    pageSize = itemsPerPage,
    showSpinner = true,
  ) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please login first.");
      }

      const params = new URLSearchParams();
      if (status && status !== "ALL") params.set("status", status);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const url = `${API_BASE}/api/registrations/?${params.toString()}`;

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
      const rows = (result.data || []) as RegistrationApiRow[];
      const formattedData = rows.map((item) => ({
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
      setTotalItems(
        typeof result.total === "number" ? result.total : formattedData.length,
      );
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
    // initial load
    fetchData(statusFilter);

    const intervalId = window.setInterval(() => {
      fetchData(statusFilter, currentPage, itemsPerPage, false);
    }, 5000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // refetch when pagination or status changes
    fetchData(statusFilter, currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, statusFilter]);

  // debounce search
  useEffect(() => {
    const id = window.setTimeout(() => {
      setCurrentPage(1);
      fetchData(statusFilter, 1, itemsPerPage);
    }, 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // data is server-paginated. Apply only letter filter and sorting locally on the current page
  const filteredData = data
    .filter((item) => {
      const matchesLetter =
        letterFilter === "ALL" ||
        item.firstName.charAt(0).toUpperCase() === letterFilter;
      return matchesLetter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      if (dateSortOrder === "newest") {
        if (dateB !== dateA) return dateB - dateA;
      } else {
        if (dateA !== dateB) return dateA - dateB;
      }

      if (sortOrder === "asc") {
        return a.firstName.localeCompare(b.firstName);
      }
      return b.firstName.localeCompare(a.firstName);
    });

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedData = filteredData; // server already paginated
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
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-2 sm:p-3 sticky top-4 flex flex-col">
      <h1
        style={{ fontSize: "22px" }}
        className="font-bold text-gray-900 mb-4 inline-flex items-center gap-2"
      >
        <UserCheck size={24} className="text-blue-600" />
        Pending Accounts
      </h1>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
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
            className="inline-flex items-center gap-1 px-5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer"
          >
            <Search size={14} />
            Search
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={letterFilter}
            onChange={(e) => {
              setLetterFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="ALL">All Letters</option>
            {alphabet.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>

          <select
            value={dateSortOrder}
            onChange={(e) => {
              setDateSortOrder(e.target.value as "newest" | "oldest");
              setCurrentPage(1);
            }}
            className="text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>

          <button
            onClick={() => {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            }}
            className="text-gray-500 flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
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

      <div className="overflow-x-auto overflow-y-auto max-h-[42vh] sm:max-h-[50vh]">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-gray-500">Loading pending accounts...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-red-500">Error: {error}</p>
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
                <th className="text-center py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-blue-100">
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
                          className="px-4 py-1 bg-blue-400 text-white rounded hover:bg-blue-500 transition text-sm font-medium cursor-pointer"
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
                              className="px-4 py-1 bg-green-400 text-white rounded hover:bg-green-500 transition text-sm font-medium cursor-pointer"
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
                              className="px-4 py-1 bg-red-400 text-white rounded hover:bg-red-500 transition text-sm font-medium cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-4 py-1 rounded text-sm font-semibold ${
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

      {filteredData.length > 0 && (
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

      {detailsTarget && (
        <UserRolesDetailsModal
          account={detailsTarget}
          onClose={() => setDetailsTarget(null)}
        />
      )}

      {assignTarget && (
        <AdminRoleAssignmentModal
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
