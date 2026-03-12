"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import ViewLogsModal from "../components/ViewLogsModal";

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

export default function Logs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState<
    "date-desc" | "date-asc" | "name-asc" | "name-desc"
  >("date-desc");
  const [currentPage, setCurrentPage] = useState(1);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const MAX_RANGE_DAYS = 14;

  // Overall allowed window: today and the 14 days before it
  const todayStr = new Date().toISOString().slice(0, 10);
  const twoWeeksAgoStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - MAX_RANGE_DAYS);
    return d.toISOString().slice(0, 10);
  })();

  // When dateFrom changes, clamp dateTo so the range never exceeds 2 weeks
  const handleDateFrom = (value: string) => {
    setDateFrom(value);
    setCurrentPage(1);
    if (value && dateTo) {
      const from = new Date(value);
      const to = new Date(dateTo);
      const maxTo = new Date(from);
      maxTo.setDate(maxTo.getDate() + MAX_RANGE_DAYS);
      if (to > maxTo) setDateTo(maxTo.toISOString().slice(0, 10));
      if (to < from) setDateTo(value);
    }
  };

  // When dateTo changes, clamp so range never exceeds 2 weeks
  const handleDateTo = (value: string) => {
    if (value && dateFrom) {
      const from = new Date(dateFrom);
      const to = new Date(value);
      const maxTo = new Date(from);
      maxTo.setDate(maxTo.getDate() + MAX_RANGE_DAYS);
      if (to > maxTo) value = maxTo.toISOString().slice(0, 10);
      if (to < from) value = dateFrom;
    }
    setDateTo(value);
    setCurrentPage(1);
  };

  // max selectable end date = min(dateFrom + 14 days, today)
  const maxDateTo = (() => {
    if (!dateFrom) return todayStr;
    const d = new Date(dateFrom);
    d.setDate(d.getDate() + MAX_RANGE_DAYS);
    const candidate = d.toISOString().slice(0, 10);
    return candidate < todayStr ? candidate : todayStr;
  })();

  const [logsData, setLogsData] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const itemsPerPage = 10;

  const fetchLogs = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLogsLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch("http://localhost:3000/api/backlogs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch logs");

      const result = await response.json();
      const formatted = (result.data || []).map((item: any) => ({
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
      setLogsError(null);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) {
        setLogsData([]);
      }
    } finally {
      if (showSpinner) {
        setLogsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs();

    const intervalId = window.setInterval(() => {
      fetchLogs(false);
    }, 5000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLogs = logsData
    .filter((log) => {
      const fullName = `${log.firstName} ${log.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "ALL" || log.role === roleFilter;
      const matchesLetter =
        letterFilter === "ALL" ||
        log.firstName.charAt(0).toUpperCase() === letterFilter;
      const logDate = new Date(log.createdAt);
      const afterFrom = !dateFrom || logDate >= new Date(dateFrom);
      const beforeTo = !dateTo
        ? true
        : (() => {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            return logDate <= end;
          })();
      return (
        matchesSearch && matchesRole && matchesLetter && afterFrom && beforeTo
      );
    })
    .sort((a, b) => {
      if (sortMode === "name-asc")
        return a.firstName.localeCompare(b.firstName);
      if (sortMode === "name-desc")
        return b.firstName.localeCompare(a.firstName);
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortMode === "date-desc" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIdx, startIdx + itemsPerPage);

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
    return map[raw?.trim()] ?? raw?.trim() ?? raw;
  };

  const formatAction = (action: string, details: string): string => {
    const d = details?.trim() || "";
    switch (action) {
      case "EMPLOYEE_CREATED":
        return d ? `Added ${d} as a new employee.` : "Added a new employee.";
      case "EMPLOYEE_UPDATED":
        return d
          ? `Updated the record of ${d}.`
          : "Updated an employee record.";
      case "EMPLOYEE_DELETED":
        return d ? `Removed ${d} from the system.` : "Removed an employee.";
      case "LEAVE_CREATED":
        return d ? `Filed a leave request for ${d}.` : "Filed a leave request.";
      case "LEAVE_UPDATED":
        return d
          ? `Updated a leave request — ${d}.`
          : "Updated a leave request.";
      case "LEAVE_DELETED":
        return d
          ? `Deleted the leave request for ${d}.`
          : "Deleted a leave request.";
      case "USER_ROLE_UPDATED": {
        // details: "Name: OLD_ROLE → NEW_ROLE"
        const ci = d.indexOf(": ");
        if (ci !== -1 && d.includes(" \u2192 ")) {
          const name = d.slice(0, ci);
          const [from, to] = d.slice(ci + 2).split(" \u2192 ");
          return `Changed ${name}'s role from ${toRoleLabel(from)} to ${toRoleLabel(to)}.`;
        }
        return d ? `Updated a user's role — ${d}.` : "Updated a user's role.";
      }
      case "USER_STATUS_UPDATED": {
        // details: "Name: Activated" or "Name: Deactivated"
        const ci = d.indexOf(": ");
        if (ci !== -1) {
          const name = d.slice(0, ci);
          const status = d.slice(ci + 2).toLowerCase();
          return status === "activated"
            ? `Activated ${name}'s account.`
            : `Deactivated ${name}'s account.`;
        }
        return d || "Updated a user's account status.";
      }
      case "USER_DELETED": {
        // details: "Name (email)"
        const pi = d.indexOf(" (");
        const name = pi !== -1 ? d.slice(0, pi) : d;
        return name
          ? `Deleted the account of ${name}.`
          : "Deleted a user account.";
      }
      case "USER_PASSWORD_RESET": {
        // details: "Password reset for Name"
        const match = d.match(/^Password reset for (.+)$/);
        return match
          ? `Reset the password of ${match[1]}.`
          : d || "Reset a user's password.";
      }
      case "REGISTRATION_APPROVED": {
        // details: "Name as ROLE"
        const ai = d.lastIndexOf(" as ");
        if (ai !== -1) {
          const name = d.slice(0, ai);
          const role = toRoleLabel(d.slice(ai + 4));
          return `Approved the registration of ${name} as ${role}.`;
        }
        return d
          ? `Approved the registration of ${d}.`
          : "Approved a registration request.";
      }
      case "REGISTRATION_REJECTED": {
        // details: "Name" or "Name: reason"
        const ci = d.indexOf(": ");
        if (ci !== -1) {
          const name = d.slice(0, ci);
          const reason = d.slice(ci + 2);
          return `Rejected the registration of ${name} — ${reason}.`;
        }
        return d
          ? `Rejected the registration of ${d}.`
          : "Rejected a registration request.";
      }
      default:
        return d
          ? `${action.replace(/_/g, " ")}: ${d}.`
          : action.replace(/_/g, " ");
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 sticky top-4 h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Logs</h1>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name or action"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="text-gray-500 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Filter Row 1 */}
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

          {/* Sort */}
          <select
            value={sortMode}
            onChange={(e) => {
              setSortMode(e.target.value as typeof sortMode);
              setCurrentPage(1);
            }}
            className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
          </select>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              min={twoWeeksAgoStr}
              max={todayStr}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="text-gray-500 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
            />
            <label className="text-sm text-gray-500 whitespace-nowrap">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || twoWeeksAgoStr}
              max={maxDateTo}
              onChange={(e) => handleDateTo(e.target.value)}
              className="text-gray-500 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setCurrentPage(1);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-sm text-gray-400 sm:ml-auto">
            {filteredLogs.length} record{filteredLogs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
        {logsLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading logs...</p>
          </div>
        ) : logsError ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Error: {logsError}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  Date &amp; Time
                </th>
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  Name
                </th>
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  Role
                </th>
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  Action Taken
                </th>
                <th className="text-center py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  View
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-1 px-3 text-gray-500 text-sm whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-1 px-3 text-gray-900 text-sm font-medium">
                      {log.firstName} {log.lastName}
                    </td>
                    <td className="py-1 px-3 text-gray-500 text-sm">
                      {roleLabelMap[log.role] ?? log.role.replace(/_/g, " ")}
                    </td>
                    <td className="py-1 px-3 text-gray-500 text-sm">
                      {formatAction(log.action, log.details)}
                    </td>
                    <td className="py-1 px-3 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-pointer"
                        aria-label={`View log #${log.id}`}
                        title="View details"
                      >
                        <Eye size={14} />
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
          ))}
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
