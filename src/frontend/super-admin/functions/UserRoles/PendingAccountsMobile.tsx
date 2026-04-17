"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpAZ,
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCheck,
} from "lucide-react";
import UserRolesDetailsModal, {
  type RegistrationDetail,
} from "../../components/UserRolesDetailsModal";
import RoleAssignmentModal from "../../components/RoleAssignmentModal";
import RejectModal from "../../components/RejectModal";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

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

type PendingAccountsMobileProps = {
  onRefreshUsers?: () => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export default function PendingAccountsMobile({
  onRefreshUsers,
}: PendingAccountsMobileProps) {
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
  const [viewTarget, setViewTarget] = useState<RegistrationDetail | null>(null);
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
      if (showSpinner) setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (searchQuery) params.set("search", searchQuery);
      if (letterFilter !== "ALL") params.set("letter", letterFilter);
      params.set("sortOrder", sortOrder);
      params.set("dateSortOrder", dateSortOrder);
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

      if (!response.ok) throw new Error("Failed to fetch registrations");

      const result = await response.json();
      const formattedData = (result.data || []).map(
        (item: Record<string, unknown>) => ({
          id: item.id as number,
          firstName: item.first_name as string,
          lastName: item.last_name as string,
          email: item.email as string,
          school: item.school_name as string,
          approved_role: item.approved_role as string | null,
          rejection_reason: item.rejection_reason as string | null,
          reviewed_at: item.reviewed_at as string | null,
          status: item.status as RegistrationRequest["status"],
          created_at: item.created_at as string,
        }),
      );
      setData(formattedData);
      setTotalItems(
        typeof result.total === "number" ? result.total : formattedData.length,
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) {
        setData([]);
        setTotalItems(0);
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(statusFilter, currentPage, itemsPerPage);
    const intervalId = window.setInterval(
      () => fetchData(statusFilter, currentPage, itemsPerPage, false),
      5000,
    );
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusFilter,
    searchQuery,
    letterFilter,
    sortOrder,
    dateSortOrder,
    currentPage,
    itemsPerPage,
  ]);

  const filteredData = data;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedData = filteredData;
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
    <div className="w-full px-3 py-4">
      <h1 className="text-lg font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
        <UserCheck size={16} className="text-blue-600" />
        Pending Accounts
      </h1>

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-4">
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
            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setCurrentPage(1)}
            className="inline-flex items-center gap-1 px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
          >
            <Search size={14} />
            Search
          </button>
        </div>

        {/* Dropdowns 2×2 grid */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
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
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              setDateSortOrder(dateSortOrder === "newest" ? "oldest" : "newest")
            }
            className="flex items-center justify-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition cursor-pointer"
          >
            {dateSortOrder === "newest" ? "Newest" : "Oldest"}
          </button>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center justify-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition cursor-pointer"
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

      {/* Account list */}
      <div className="border border-blue-200 bg-white rounded-xl shadow-lg p-4 flex flex-col gap-4">
        {loading ? (
          <p className="text-center text-sm text-gray-500 py-8">
            Loading pending accounts...
          </p>
        ) : error ? (
          <p className="text-center text-sm text-red-500 py-8">
            Error: {error}
          </p>
        ) : paginatedData.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            No accounts found.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {paginatedData.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {item.firstName} {item.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{item.email}</p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() =>
                      setViewTarget({
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
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition cursor-pointer shrink-0"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                Show
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                    setPageJumpInput("1");
                  }}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                entries
              </label>

              <div className="flex items-center gap-2 text-xs text-gray-600">
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
                  className="w-14 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
                />
                <button
                  onClick={handleJumpToPage}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                >
                  Go
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1">
              {pageNumberItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-xs text-gray-400 select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`h-8 min-w-8 rounded px-2 text-xs font-medium transition cursor-pointer ${
                      currentPage === item
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      {/* Details modal */}
      {viewTarget && (
        <PendingDetailsModal
          account={viewTarget}
          onClose={() => setViewTarget(null)}
          onAssignRole={() => {
            setAssignTarget({
              id: viewTarget.id,
              name: `${viewTarget.firstName} ${viewTarget.lastName}`,
            });
            setViewTarget(null);
          }}
          onReject={() => {
            setRejectTarget({
              id: viewTarget.id,
              name: `${viewTarget.firstName} ${viewTarget.lastName}`,
            });
            setViewTarget(null);
          }}
        />
      )}

      {/* Assign role modal */}
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

      {/* Reject modal */}
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

/* ------------------------------------------------------------------ */
/* Details bottom-sheet modal with action buttons                      */
/* ------------------------------------------------------------------ */

function PendingDetailsModal({
  account,
  onClose,
  onAssignRole,
  onReject,
}: {
  account: RegistrationDetail;
  onClose: () => void;
  onAssignRole: () => void;
  onReject: () => void;
}) {
  const formattedDate = new Date(account.created_at).toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedReviewedDate = account.reviewed_at
    ? new Date(account.reviewed_at).toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const statusColor =
    account.status === "PENDING"
      ? "bg-yellow-100 text-yellow-800"
      : account.status === "APPROVED"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";

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
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Registration Details
          </h2>

          <div className="space-y-0">
            <PRow
              label="Full Name"
              value={`${account.firstName} ${account.lastName}`}
            />
            <PRow label="Email" value={account.email} />
            <PRow label="School" value={account.school} />
            <PRow label="Date Registered" value={formattedDate} />
            {formattedReviewedDate && (
              <PRow label="Processed At" value={formattedReviewedDate} />
            )}
            {account.status === "APPROVED" && account.approved_role && (
              <PRow
                label="Assigned Role"
                value={account.approved_role.replace(/_/g, " ")}
              />
            )}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Status</span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}
              >
                {account.status}
              </span>
            </div>
            {account.status === "REJECTED" && account.rejection_reason && (
              <div className="py-3 border-b border-gray-100">
                <span className="block text-sm font-medium text-gray-500 mb-1">
                  Rejection Reason
                </span>
                <p className="text-sm text-gray-800 wrap-break-word">
                  {account.rejection_reason}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {account.status === "PENDING" ? (
            <div className="mt-6 flex gap-3">
              <button
                onClick={onAssignRole}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition cursor-pointer"
              >
                Assign Role
              </button>
              <button
                onClick={onReject}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition cursor-pointer"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-500 shrink-0 mr-4">
        {label}
      </span>
      <span className="text-sm text-gray-800 text-right wrap-break-word">
        {value}
      </span>
    </div>
  );
}

