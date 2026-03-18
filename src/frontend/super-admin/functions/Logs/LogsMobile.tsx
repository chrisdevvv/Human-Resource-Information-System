"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ViewLogsModal from "../../components/ViewLogsModal";

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

export default function LogsMobile() {
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const twoWeeksAgoStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - MAX_RANGE_DAYS);
    return d.toISOString().slice(0, 10);
  })();

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
      if (showSpinner) setLogsLoading(true);

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
      const formatted = (result.data || []).map(
        (item: Record<string, unknown>) => ({
          id: item.id as number,
          userId: item.user_id as number,
          firstName: (item.first_name as string) || "Unknown",
          lastName: (item.last_name as string) || "",
          role: (item.role as string) || "N/A",
          email: (item.email as string) || "N/A",
          schoolName: (item.school_name as string) || "N/A",
          action: (item.action as string) || "N/A",
          details: (item.details as string) || "",
          createdAt: item.created_at as string,
        }),
      );
      setLogsData(formatted);
      setLogsError(null);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) setLogsData([]);
    } finally {
      if (showSpinner) setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const intervalId = window.setInterval(() => fetchLogs(false), 5000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLogs = logsData
    .filter((log) => {
      const query = searchQuery.trim().toLowerCase();
      const fullName = `${log.firstName} ${log.lastName}`.toLowerCase();
      const logDate = new Date(log.createdAt);

      const searchableDateParts = Number.isNaN(logDate.getTime())
        ? []
        : [
            log.createdAt.toLowerCase(),
            logDate.toISOString().slice(0, 10),
            logDate.toLocaleDateString("en-PH"),
            logDate.toLocaleString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            logDate.toLocaleString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          ].map((value) => value.toLowerCase());

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        log.action.toLowerCase().includes(query) ||
        searchableDateParts.some((datePart) => datePart.includes(query));
      const matchesRole = roleFilter === "ALL" || log.role === roleFilter;
      const matchesLetter =
        letterFilter === "ALL" ||
        log.firstName.charAt(0).toUpperCase() === letterFilter;
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
        const ci = d.indexOf(": ");
        if (ci !== -1 && d.includes(" \u2192 ")) {
          const name = d.slice(0, ci);
          const [from, to] = d.slice(ci + 2).split(" \u2192 ");
          return `Changed ${name}'s role from ${toRoleLabel(from)} to ${toRoleLabel(to)}.`;
        }
        return d ? `Updated a user's role — ${d}.` : "Updated a user's role.";
      }
      case "USER_STATUS_UPDATED": {
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
        const pi = d.indexOf(" (");
        const name = pi !== -1 ? d.slice(0, pi) : d;
        return name
          ? `Deleted the account of ${name}.`
          : "Deleted a user account.";
      }
      case "USER_PASSWORD_RESET": {
        const match = d.match(/^Password reset for (.+)$/);
        return match
          ? `Reset the password of ${match[1]}.`
          : d || "Reset a user's password.";
      }
      case "REGISTRATION_APPROVED": {
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
    <div className="w-full px-3 py-4">
      <h1 className="text-lg font-bold text-gray-900 mb-4">Activity Logs</h1>

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, action, or date"
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

        {/* Filters 2×2 grid */}
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

          <select
            value={sortMode}
            onChange={(e) => {
              setSortMode(e.target.value as typeof sortMode);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
          </select>

          <select
            value=""
            onChange={(e) => {
              if (e.target.value === "clear") {
                setDateFrom("");
                setDateTo("");
                setCurrentPage(1);
              }
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Date Range</option>
            <option value="clear">Clear Dates</option>
          </select>
        </div>

        {/* Date inputs - stacked on mobile */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <label className="text-xs text-gray-500 whitespace-nowrap">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              min={twoWeeksAgoStr}
              max={todayStr}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs text-gray-500 whitespace-nowrap">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || twoWeeksAgoStr}
              max={maxDateTo}
              onChange={(e) => handleDateTo(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <p className="text-xs text-gray-400">
          {filteredLogs.length} record{filteredLogs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Logs list */}
      <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col gap-4">
        {logsLoading ? (
          <p className="text-center text-sm text-gray-500 py-8">
            Loading logs...
          </p>
        ) : logsError ? (
          <p className="text-center text-sm text-red-500 py-8">
            Error: {logsError}
          </p>
        ) : paginatedLogs.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            No logs found.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 truncate">
                    {formatDateTime(log.createdAt)}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {log.firstName} {log.lastName}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {formatAction(log.action, log.details)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(log)}
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
              <span className="font-semibold text-gray-800">{currentPage}</span>{" "}
              of{" "}
              <span className="font-semibold text-gray-800">{totalPages}</span>
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

      {/* View logs modal */}
      {selectedLog && (
        <ViewLogsModal
          visible={true}
          log={{
            name: `${selectedLog.firstName} ${selectedLog.lastName}`.trim(),
            role:
              roleLabelMap[selectedLog.role] ??
              selectedLog.role.replace(/_/g, " "),
            email: selectedLog.email,
            school: selectedLog.schoolName,
            dateTime: formatDateTime(selectedLog.createdAt),
            actionTaken: formatAction(selectedLog.action, selectedLog.details),
          }}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
