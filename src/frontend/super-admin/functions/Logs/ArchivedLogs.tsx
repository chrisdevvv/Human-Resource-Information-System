"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  FileText,
  Search,
} from "lucide-react";
import ViewLogsModal from "../../components/ViewLogsModal";
import { getLogsReportRoute } from "@/frontend/route";

type Log = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  schoolName: string;
  action: string;
  details: string;
  createdAt: string;
};

type LogApiRow = {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  role?: string;
  email?: string;
  school_name?: string;
  action?: string;
  details?: string;
  created_at: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function ArchivedLogs() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState<
    "date-desc" | "date-asc" | "name-asc" | "name-desc"
  >("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageJumpInput, setPageJumpInput] = useState("1");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [logsData, setLogsData] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const todayStr = new Date().toISOString().slice(0, 10);

  const handleDateFrom = (value: string) => {
    setDateFrom(value);
    setCurrentPage(1);
    if (value && dateTo && new Date(dateTo) < new Date(value)) {
      setDateTo(value);
    }
  };

  const handleDateTo = (value: string) => {
    if (value && dateFrom && new Date(value) < new Date(dateFrom)) {
      value = dateFrom;
    }
    setDateTo(value);
    setCurrentPage(1);
  };

  const handleGenerateArchivedReport = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    if (letterFilter !== "ALL") params.set("letter", letterFilter);
    if (sortMode) params.set("sortMode", sortMode);
    params.set("report_scope", "archived");

    const query = params.toString();
    router.push(getLogsReportRoute(query || "report_scope=archived"));
  };

  const fetchLogs = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLogsLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const params = new URLSearchParams();
      params.set("only_archived", "true");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (letterFilter !== "ALL") params.set("letter", letterFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      params.set("sortMode", sortMode);
      params.set("page", String(currentPage));
      params.set("pageSize", String(itemsPerPage));

      const response = await fetch(
        `${API_BASE}/api/backlogs?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch archived logs");

      const result = await response.json();
      const rows = (result.data || []) as LogApiRow[];
      const formatted = rows.map((item) => ({
        id: item.id,
        userId: item.user_id,
        firstName: item.first_name || "Unknown",
        lastName: item.last_name || "",
        role: item.role || "N/A",
        email: item.email || "N/A",
        schoolName: item.school_name || "N/A",
        action: item.action || "N/A",
        details: item.details || "",
        createdAt: item.created_at,
      }));

      setLogsData(formatted);
      setTotalItems(
        typeof result.total === "number" ? result.total : formatted.length,
      );
      setLogsError(null);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) {
        setLogsData([]);
        setTotalItems(0);
      }
    } finally {
      if (showSpinner) {
        setLogsLoading(false);
      }
    }
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    roleFilter,
    letterFilter,
    sortMode,
    dateFrom,
    dateTo,
    currentPage,
    itemsPerPage,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

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

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setLetterFilter("ALL");
    setSortMode("date-desc");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    setPageJumpInput("1");
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    roleFilter !== "ALL" ||
    letterFilter !== "ALL" ||
    sortMode !== "date-desc" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const roleLabelMap: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    DATA_ENCODER: "Data Encoder",
  };

  const toRoleLabel = (raw: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
      DATA_ENCODER: "Data Encoder",
    };

    const value = String(raw || "").trim();
    const normalized = value.toUpperCase().replace(/\s+/g, "_");
    if (map[normalized]) return map[normalized];

    return value
      ? value
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : value;
  };

  const formatAction = (action: string, details: string): string => {
    const d = details?.trim() || "";
    const normalizedAction = String(action || "")
      .trim()
      .toUpperCase();

    if (!normalizedAction || normalizedAction === "N/A") {
      const roleChange = d.match(/^(.+?):\s*(.+?)\s*(?:→|->|to)\s*(.+)$/i);
      if (roleChange) {
        const [, name, from, to] = roleChange;
        return `Changed ${name}'s role from ${toRoleLabel(from)} to ${toRoleLabel(to)}.`;
      }

      const assignedRole = d.match(/^(.+?)\s+as\s+(.+)$/i);
      if (assignedRole) {
        const [, name, role] = assignedRole;
        return `Assigned ${name} as ${toRoleLabel(role)}.`;
      }

      const pwdReset = d.match(/^Password reset for (.+)$/i);
      if (pwdReset) {
        return `Reset the password of ${pwdReset[1]}.`;
      }

      return d || "No action details available.";
    }

    return d
      ? `${normalizedAction.replace(/_/g, " ")}: ${d}.`
      : normalizedAction.replace(/_/g, " ");
  };

  const pageNumberItems = React.useMemo<Array<number | "ellipsis">>(() => {
    const PAGE_WINDOW_SIZE = 5;
    const pageGroupStart =
      Math.floor((currentPage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
    const pageGroupEnd = Math.min(
      totalPages,
      pageGroupStart + PAGE_WINDOW_SIZE - 1,
    );

    const items: Array<number | "ellipsis"> = Array.from(
      { length: pageGroupEnd - pageGroupStart + 1 },
      (_, i) => pageGroupStart + i,
    );

    if (pageGroupEnd < totalPages) {
      if (totalPages - pageGroupEnd > 1) {
        items.push("ellipsis");
      }
      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="w-full min-w-0 bg-white rounded-lg shadow-lg p-2 sm:p-3 sticky top-4 flex flex-col">
      <h1
        style={{ fontSize: "20px" }}
        className="font-bold text-gray-900 mb-4 inline-flex items-center gap-2"
      >
        <FileText size={24} className="text-blue-600" />
        Archived Logs
      </h1>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, action, or date"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="text-gray-500 w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              className="inline-flex items-center gap-1 px-5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer"
            >
              <Search size={14} />
              Search
            </button>
            <button
              onClick={handleGenerateArchivedReport}
              className="inline-flex items-center gap-1 px-5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm cursor-pointer"
            >
              <FileDown size={14} />
              Generate Report
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="DATA_ENCODER">Data Encoder</option>
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
            value={sortMode}
            onChange={(e) => {
              setSortMode(e.target.value as typeof sortMode);
              setCurrentPage(1);
            }}
            className="text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              max={todayStr}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
            />
            <label className="text-sm text-gray-500 whitespace-nowrap">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || ""}
              max={todayStr}
              onChange={(e) => handleDateTo(e.target.value)}
              className="text-gray-500 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setCurrentPage(1);
                  setPageJumpInput("1");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-sm text-gray-400 sm:ml-auto">
            {totalItems} record{totalItems !== 1 ? "s" : ""}
          </span>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-sm text-gray-500 underline hover:text-gray-700 transition cursor-pointer"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[42vh] sm:max-h-[50vh]">
        {logsLoading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-gray-500">Loading logs...</p>
          </div>
        ) : logsError ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-red-500">Error: {logsError}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-blue-100">
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                  Date &amp; Time
                </th>
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                  Name
                </th>
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                  Role
                </th>
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                  Action Taken
                </th>
                <th className="text-center py-1 px-3 font-semibold text-blue-600 uppercase text-xs bg-blue-100">
                  View
                </th>
              </tr>
            </thead>
            <tbody>
              {logsData.length > 0 ? (
                logsData.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-0.5 px-3 text-gray-500 text-sm whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-0.5 px-3 text-gray-900 text-sm font-medium">
                      {log.firstName} {log.lastName}
                    </td>
                    <td className="py-0.5 px-3 text-gray-500 text-sm">
                      {roleLabelMap[log.role] ?? log.role.replace(/_/g, " ")}
                    </td>
                    <td className="py-0.5 px-3 text-gray-500 text-sm">
                      <span
                        className="block max-w-[24rem] truncate"
                        title={formatAction(log.action, log.details)}
                      >
                        {formatAction(log.action, log.details)}
                      </span>
                    </td>
                    <td className="py-0.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-pointer"
                        aria-label={`View log #${log.id}`}
                        title="View details"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {logsData.length > 0 && (
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
                className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}

      <ViewLogsModal
        visible={!!selectedLog}
        log={
          selectedLog
            ? {
                name: `${selectedLog.firstName} ${selectedLog.lastName}`.trim(),
                role:
                  roleLabelMap[selectedLog.role] ??
                  selectedLog.role.replace(/_/g, " "),
                email: selectedLog.email,
                school: selectedLog.schoolName,
                dateTime: formatDateTime(selectedLog.createdAt),
                actionTaken: formatAction(
                  selectedLog.action,
                  selectedLog.details,
                ),
              }
            : null
        }
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}

