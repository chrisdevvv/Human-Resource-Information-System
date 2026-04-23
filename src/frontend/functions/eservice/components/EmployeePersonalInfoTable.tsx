"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
} from "lucide-react";
import type { EmployeePersonalInfoRecord } from "../modals/AddEmployeePersonalInfoModal";

type Props = {
  loading: boolean;
  error: string | null;
  rows: EmployeePersonalInfoRecord[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onEdit: (employee: EmployeePersonalInfoRecord) => void;
  onDelete: (employee: EmployeePersonalInfoRecord) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const formatDateForDisplay = (value?: string | null) => {
  if (!value) return "—";

  const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

const getStatusClasses = (status?: string | null) => {
  const normalized = (status || "").trim().toLowerCase();

  if (
    normalized === "active" ||
    normalized === "permanent" ||
    normalized === "regular" ||
    normalized === "teaching" ||
    normalized === "non-teaching"
  ) {
    return "border border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (
    normalized === "inactive" ||
    normalized === "resigned" ||
    normalized === "separated"
  ) {
    return "border border-red-200 bg-red-100 text-red-700";
  }

  if (
    normalized === "pending" ||
    normalized === "temporary" ||
    normalized === "provisional"
  ) {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }

  return "border border-gray-200 bg-gray-100 text-gray-700";
};

export default function EmployeePersonalInfoTable({
  loading,
  error,
  rows,
  totalItems,
  currentPage,
  itemsPerPage,
  onEdit,
  onDelete,
  onPageChange,
  onItemsPerPageChange,
}: Props) {
  const [mobileCardIndex, setMobileCardIndex] = React.useState(0);
  const [pageJumpInput, setPageJumpInput] = React.useState("1");
  
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

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

  React.useEffect(() => {
    if (currentPage > totalPages) {
      onPageChange(totalPages);
      return;
    }

    setPageJumpInput(String(currentPage));
  }, [currentPage, totalPages, onPageChange]);

  const handleJumpToPage = () => {
    const parsed = Number.parseInt(pageJumpInput, 10);
    if (Number.isNaN(parsed)) {
      setPageJumpInput(String(currentPage));
      return;
    }

    const nextPage = Math.min(totalPages, Math.max(1, parsed));
    onPageChange(nextPage);
    setPageJumpInput(String(nextPage));
  };

  const hasData = !loading && !error && rows.length > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      {/* Top Filters */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Search employee"
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 placeholder:text-xs placeholder:text-gray-400 outline-none transition focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/10"
          />

          <button
            type="button"
            className="cursor-pointer inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-[#2563eb] px-3 text-xs font-medium text-white transition hover:bg-[#1d4ed8] sm:min-w-[90px]"
          >
            <Search className="h-3 w-3" />
            Search
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[170px_minmax(0,1fr)_140px_150px_92px]">
          <select className="cursor-pointer h-7 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-700 outline-none transition focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/10">
            <option>All Employee Types</option>
          </select>

          <select className="cursor-pointer h-7 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-700 outline-none transition focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/10">
            <option>All Schools</option>
          </select>

          <select className="cursor-pointer h-7 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-700 outline-none transition focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/10">
            <option>All Letters</option>
          </select>

          <select className="cursor-pointer h-7 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-700 outline-none transition focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/10">
            <option>All</option>
          </select>

          <button
            type="button"
            className="cursor-pointer inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowUpDown className="h-3 w-3" />
            A-Z
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1750px]">
            <thead className="bg-[#dbe8fb]">
              <tr>
                {[
                  "ID",
                  "DEPED EMAIL",
                  "DISTRICT",
                  "SCHOOL",
                  "LAST NAME",
                  "FIRST NAME",
                  "MIDDLE NAME",
                  "MIDDLE INITIAL",
                  "CIVIL STATUS",
                  "SEX",
                  "DATE OF BIRTH",
                  "PLACE OF BIRTH",
                  "STATUS",
                  "ACTION",
                ].map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#2563eb]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Loading employee records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-10 text-center text-sm text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No employee records found.
                  </td>
                </tr>
              ) : (
                rows.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-t border-gray-200 bg-white text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 align-top font-medium text-gray-900">
                      {employee.id}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      {employee.email || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      {employee.district || "—"}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <div className="min-w-[220px]">{employee.school || "—"}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top font-medium text-gray-900">
                      {employee.lastName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top font-medium text-gray-900">
                      {employee.firstName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      {employee.middleName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      {employee.middleInitial || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      {employee.civilStatus || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      {employee.gender || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      {formatDateForDisplay(employee.dateOfBirth)}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <div className="min-w-[200px]">{employee.place || "—"}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                          employee.teacherStatus
                        )}`}
                      >
                        {employee.teacherStatus || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(employee)}
                          className="cursor-pointer inline-flex h-8 items-center justify-center gap-1 rounded-md bg-[#2563eb] px-2.5 text-xs font-medium text-white transition hover:bg-[#1d4ed8]"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(employee)}
                          className="cursor-pointer inline-flex h-8 items-center justify-center gap-1 rounded-md bg-red-500 px-2.5 text-xs font-medium text-white transition hover:bg-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
            Loading employee records...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-500 shadow-sm">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
            No employee records found.
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const employee = rows[mobileCardIndex];
              return (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {[employee.firstName, employee.middleName, employee.lastName]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          ID: {employee.id ?? "—"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                          employee.teacherStatus
                        )}`}
                      >
                        {employee.teacherStatus || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 px-4 py-4">
                    <div className="grid grid-cols-2 gap-3">
                      <MobileField label="DepEd Email" value={employee.email || "—"} />
                      <MobileField label="District" value={employee.district || "—"} />
                    </div>

                    <MobileField label="School" value={employee.school || "—"} />

                    <div className="grid grid-cols-2 gap-3">
                      <MobileField label="Last Name" value={employee.lastName || "—"} />
                      <MobileField label="First Name" value={employee.firstName || "—"} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MobileField
                        label="Middle Name"
                        value={employee.middleName || "—"}
                      />
                      <MobileField
                        label="Middle Initial"
                        value={employee.middleInitial || "—"}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MobileField
                        label="Civil Status"
                        value={employee.civilStatus || "—"}
                      />
                      <MobileField label="Sex" value={employee.gender || "—"} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MobileField
                        label="Date of Birth"
                        value={formatDateForDisplay(employee.dateOfBirth)}
                      />
                      <MobileField label="Place of Birth" value={employee.place || "—"} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onEdit(employee)}
                      className="cursor-pointer inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] px-3 text-xs font-medium text-white transition hover:bg-[#1d4ed8]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(employee)}
                      className="cursor-pointer inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 text-xs font-medium text-white transition hover:bg-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Mobile Navigation */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMobileCardIndex(0)}
                  disabled={mobileCardIndex === rows.length - 1}
                  className="cursor-pointer inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Jump to Start
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </button>

                              <button
                  type="button"
                  onClick={() => setMobileCardIndex(rows.length - 1)}
                  disabled={mobileCardIndex === 0}
                  className="cursor-pointer inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronsRight  className="h-3.5 w-3.5" />
                  Jump to Last
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMobileCardIndex(Math.max(0, mobileCardIndex - 1))}
                  disabled={mobileCardIndex === 0}
                  className="cursor-pointer inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>

                <span className="text-xs text-gray-600">
                  {mobileCardIndex + 1} / {rows.length}
                </span>

                <button
                  type="button"
                  onClick={() => setMobileCardIndex(Math.min(rows.length - 1, mobileCardIndex + 1))}
                  disabled={mobileCardIndex === rows.length - 1}
                  className="cursor-pointer inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-[#fafafa] px-3 py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="cursor-pointer h-6 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-[#2563eb]"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || !hasData}
              className="cursor-pointer inline-flex h-6 items-center justify-center gap-0.5 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3 w-3" />
              Previous
            </button>

            {pageNumberItems.map(
              (item: number | "ellipsis", index: number) => {
                if (item === "ellipsis") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-xs text-gray-400 select-none"
                    >
                      ...
                    </span>
                  );
                }

                const isActive = item === currentPage;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPageChange(item)}
                    disabled={!hasData}
                    className={`cursor-pointer inline-flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-xs font-medium transition ${
                      isActive
                        ? "bg-[#2563eb] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {item}
                  </button>
                );
              },
            )}

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || !hasData}
              className="cursor-pointer inline-flex h-6 items-center justify-center gap-0.5 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-700 lg:justify-end">
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
              className="h-6 w-12 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none"
            />
            <button
              type="button"
              onClick={handleJumpToPage}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Go
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-600 sm:text-sm">
        Showing {startIndex} to {endIndex} of {totalItems} entries
      </div>
    </div>
  );
}

type MobileFieldProps = {
  label: string;
  value: string;
};

function MobileField({ label, value }: MobileFieldProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}