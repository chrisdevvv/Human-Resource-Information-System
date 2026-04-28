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
  Filter,
  RotateCcw,
  Eye,
  X,
} from "lucide-react";
import type { EmployeePersonalInfoRecord } from "../modals/AddEmployeePersonalInfoModal";
import EPITSkeleton from "./EPITSkeleton";

type DistrictOption = {
  districtId: number | string;
  districtName: string;
  status?: number;
};

type SchoolOption = {
  id: number | string;
  name: string;
  district?: string | null;
};

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
  searchQuery: string;
  onSearchChange: (value: string) => void;
  districtFilter: string;
  onDistrictChange: (value: string) => void;
  schoolFilter: string;
  onSchoolChange: (value: string) => void;
  civilStatusFilter: string;
  onCivilStatusChange: (value: string) => void;
  sexFilter: string;
  onSexChange: (value: string) => void;
  employeeTypeFilter: string;
  onEmployeeTypeChange: (value: string) => void;
  letterFilter: string;
  onLetterChange: (value: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: () => void;
  districts: DistrictOption[];
  schools: SchoolOption[];
  lookupLoading?: boolean;
  onSearch: () => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Separated"];
const SEX_OPTIONS = ["Male", "Female"];

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

const getFullName = (employee: EmployeePersonalInfoRecord) =>
  [employee.firstName, employee.middleName, employee.lastName]
    .filter(Boolean)
    .join(" ") || "—";

const displayValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
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
  searchQuery,
  onSearchChange,
  districtFilter,
  onDistrictChange,
  schoolFilter,
  onSchoolChange,
  civilStatusFilter,
  onCivilStatusChange,
  sexFilter,
  onSexChange,
  employeeTypeFilter,
  onEmployeeTypeChange,
  letterFilter,
  onLetterChange,
  sortOrder,
  onSortOrderChange,
  districts,
  schools,
  lookupLoading = false,
  onSearch,
}: Props) {
  const [mobileCardIndex, setMobileCardIndex] = React.useState(0);
  const [pageJumpInput, setPageJumpInput] = React.useState("1");
  const [viewEmployee, setViewEmployee] =
    React.useState<EmployeePersonalInfoRecord | null>(null);

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
    if (totalPages - pageGroupEnd > 1) pageNumberItems.push("ellipsis");
    pageNumberItems.push(totalPages);
  }

  const hasData = !loading && !error && rows.length > 0;

  const filteredSchoolOptions = React.useMemo(() => {
    if (!districtFilter) return schools;

    return schools.filter(
      (school) => !school.district || school.district === districtFilter,
    );
  }, [schools, districtFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    districtFilter !== "" ||
    schoolFilter !== "" ||
    civilStatusFilter !== "" ||
    sexFilter !== "" ||
    employeeTypeFilter !== "" ||
    letterFilter !== "" ||
    sortOrder !== "asc";

  const handleResetFilters = () => {
    onSearchChange("");
    onDistrictChange("");
    onSchoolChange("");
    onCivilStatusChange("");
    onSexChange("");
    onEmployeeTypeChange("");
    onLetterChange("");

    if (sortOrder !== "asc") {
      onSortOrderChange();
    }

    onPageChange(1);
  };

  React.useEffect(() => {
    if (currentPage > totalPages) {
      onPageChange(totalPages);
      return;
    }

    setPageJumpInput(String(currentPage));
  }, [currentPage, totalPages, onPageChange]);

  React.useEffect(() => {
    if (!rows.length) {
      setMobileCardIndex(0);
      return;
    }

    if (mobileCardIndex > rows.length - 1) {
      setMobileCardIndex(rows.length - 1);
    }
  }, [rows, mobileCardIndex]);

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

  if (loading) return <EPITSkeleton />;

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        {/* Top Filters */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-800"
              >
                <RotateCcw className="h-3 w-3" />
                Clear Filters
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-gray-700">
                District
              </label>
              <select
                value={districtFilter}
                onChange={(e) => {
                  onDistrictChange(e.target.value);
                  onSchoolChange("");
                  onPageChange(1);
                }}
                disabled={lookupLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Select district</option>
                {districts
                  .filter((district) => district.status !== 0)
                  .map((district) => (
                    <option
                      key={String(district.districtId)}
                      value={district.districtName}
                    >
                      {district.districtName}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-gray-700">
                Schools
              </label>
              <select
                value={schoolFilter}
                onChange={(e) => {
                  onSchoolChange(e.target.value);
                  onPageChange(1);
                }}
                disabled={lookupLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Select school</option>
                {filteredSchoolOptions.map((school) => (
                  <option key={String(school.id)} value={school.name}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-gray-700">
                Civil Status
              </label>
              <select
                value={civilStatusFilter}
                onChange={(e) => {
                  onCivilStatusChange(e.target.value);
                  onPageChange(1);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select civil status</option>
                {CIVIL_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-gray-700">
                Sex
              </label>
              <select
                value={sexFilter}
                onChange={(e) => {
                  onSexChange(e.target.value);
                  onPageChange(1);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select sex</option>
                {SEX_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-gray-700">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    onPageChange(1);
                  }}
                  placeholder="Search..."
                  className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-gray-700">
                Employee Type
              </label>
              <select
                value={employeeTypeFilter}
                onChange={(e) => {
                  onEmployeeTypeChange(e.target.value);
                  onPageChange(1);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All Employee Types</option>
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-gray-700">
                Letter
              </label>
              <select
                value={letterFilter}
                onChange={(e) => {
                  onLetterChange(e.target.value);
                  onPageChange(1);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All Letters</option>
                {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-gray-700">
                Sort
              </label>
              <button
                type="button"
                onClick={onSortOrderChange}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <ArrowUpDown className="h-3 w-3" />
                {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-gray-700">
                Apply
              </label>
              <button
                type="button"
                onClick={onSearch}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <Search className="h-3 w-3" />
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
          <div className="max-h-96 overflow-x-auto overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-blue-100">
                <tr>
                  {["FULL NAME", "DEPED EMAIL", "SCHOOL", "STATUS", "ACTIONS"].map(
                    (header) => (
                      <th
                        key={header}
                        className="whitespace-nowrap px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-blue-600"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {error ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-sm text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-sm text-gray-500"
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
                      <td className="whitespace-nowrap px-2 py-1 align-middle font-medium text-gray-900">
                        {getFullName(employee)}
                      </td>

                      <td className="whitespace-nowrap px-2 py-1 align-middle">
                        {employee.email || "—"}
                      </td>

                      <td className="px-2 py-1 align-middle">
                        <div className="min-w-64">{employee.school || "—"}</div>
                      </td>

                      <td className="whitespace-nowrap px-2 py-1 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-sm font-medium ${getStatusClasses(
                            employee.teacherStatus,
                          )}`}
                        >
                          {employee.teacherStatus || "—"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-2 py-1 align-middle">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewEmployee(employee)}
                            className="inline-flex h-6 cursor-pointer items-center justify-center gap-1 rounded-md bg-sky-600 px-2 text-sm font-medium text-white transition hover:bg-sky-700"
                            title="View"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => onEdit(employee)}
                            className="inline-flex h-6 cursor-pointer items-center justify-center gap-1 rounded-md bg-blue-600 px-2 text-sm font-medium text-white transition hover:bg-blue-700"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(employee)}
                            className="inline-flex h-6 cursor-pointer items-center justify-center gap-1 rounded-md bg-red-500 px-2 text-sm font-medium text-white transition hover:bg-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
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
          {error ? (
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
                            {getFullName(employee)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {employee.email || "—"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-sm font-medium ${getStatusClasses(
                            employee.teacherStatus,
                          )}`}
                        >
                          {employee.teacherStatus || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 px-4 py-4">
                      <MobileField label="Full Name" value={getFullName(employee)} />
                      <MobileField
                        label="DepEd Email"
                        value={employee.email || "—"}
                      />
                      <MobileField label="School" value={employee.school || "—"} />
                      <MobileField
                        label="Status"
                        value={employee.teacherStatus || "—"}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setViewEmployee(employee)}
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 text-sm font-medium text-white transition hover:bg-sky-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(employee)}
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(employee)}
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 text-sm font-medium text-white transition hover:bg-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileCardIndex(0)}
                    disabled={mobileCardIndex === 0}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                    Jump to Start
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileCardIndex(rows.length - 1)}
                    disabled={mobileCardIndex === rows.length - 1}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Jump to Last
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileCardIndex(Math.max(0, mobileCardIndex - 1))
                    }
                    disabled={mobileCardIndex === 0}
                    className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    {mobileCardIndex + 1} / {rows.length}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setMobileCardIndex(
                        Math.min(rows.length - 1, mobileCardIndex + 1),
                      )
                    }
                    disabled={mobileCardIndex === rows.length - 1}
                    className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>Show</span>

              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="h-6 cursor-pointer rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none transition focus:border-blue-600"
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
                className="inline-flex h-6 cursor-pointer items-center justify-center gap-0.5 rounded-md border border-gray-200 bg-white px-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3 w-3" />
                Previous
              </button>

              {pageNumberItems.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="select-none px-2 text-sm text-gray-400"
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
                    className={`inline-flex h-6 min-w-6 cursor-pointer items-center justify-center rounded-md px-1.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {item}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || !hasData}
                className="inline-flex h-6 cursor-pointer items-center justify-center gap-0.5 rounded-md border border-gray-200 bg-white px-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-700 lg:justify-end">
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
                className="h-6 w-12 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none"
              />

              <button
                type="button"
                onClick={handleJumpToPage}
                className="cursor-pointer rounded-md px-2 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Go
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600 sm:text-sm">
          Showing {startIndex} to {endIndex} of {totalItems} entries
        </div>
      </div>

      {viewEmployee ? (
        <ViewEmployeeDetailsModal
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
        />
      ) : null}
    </>
  );
}

type MobileFieldProps = {
  label: string;
  value: string;
};

function MobileField({ label, value }: MobileFieldProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
      <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-gray-800">
        {value}
      </p>
    </div>
  );
}

type ViewEmployeeDetailsModalProps = {
  employee: EmployeePersonalInfoRecord;
  onClose: () => void;
};

function ViewEmployeeDetailsModal({
  employee,
  onClose,
}: ViewEmployeeDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-blue-50 px-5 py-4">
          <div>
            <h2 className="text-base font-bold uppercase text-gray-900">
              Employee Details
            </h2>
            <p className="mt-1 text-sm font-medium text-blue-700">
              {getFullName(employee)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField label="Full Name" value={getFullName(employee)} />
            <DetailField label="DepEd Email" value={employee.email} />
            <DetailField label="MIS/R" value={employee.misr} />
            <DetailField label="District" value={employee.district} />
            <DetailField label="School" value={employee.school} />
            <DetailField label="Status" value={employee.teacherStatus} />
            <DetailField label="Last Name" value={employee.lastName} />
            <DetailField label="First Name" value={employee.firstName} />
            <DetailField label="Middle Name" value={employee.middleName} />
            <DetailField label="Middle Initial" value={employee.middleInitial} />
            <DetailField label="Civil Status" value={employee.civilStatus} />
            <DetailField label="Sex" value={employee.gender} />
            <DetailField label="Date of Birth" value={employee.dateOfBirth} />
            <DetailField label="Place of Birth" value={employee.place} />
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

type DetailFieldProps = {
  label: string;
  value?: string | number | null;
};

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {displayValue(value)}
      </p>
    </div>
  );
}