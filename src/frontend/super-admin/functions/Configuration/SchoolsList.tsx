"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type SchoolsListProps = {
  items: Array<{ id: number; school_name: string }>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onAdd: () => void;
  onDelete: (id: number, name: string) => void;
  sortValue: "a-z" | "z-a";
  onSortChange: (value: "a-z" | "z-a") => void;
};

export default function SchoolsList({
  items,
  searchValue,
  onSearchChange,
  hasActiveFilters,
  onClearFilters,
  onAdd,
  onDelete,
  sortValue,
  onSortChange,
}: SchoolsListProps) {
  const PAGE_SIZE_OPTIONS = [10, 20, 50];
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
  const [pageJumpInput, setPageJumpInput] = useState("1");

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
    setPageJumpInput("1");
  }, [searchValue, sortValue, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      return;
    }

    setPageJumpInput(String(currentPage));
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [currentPage, items, itemsPerPage]);

  const pageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages] as const;
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ] as const;
    }

    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    ] as const;
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
    <section className="rounded-2xl border border-blue-200 bg-white shadow-sm flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Schools</h2>
              <p className="text-sm text-gray-500">
                Manage school options shown in dropdown fields.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-full sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
            <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-1.5">
              <div className="relative w-full sm:w-64 lg:w-80">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search schools..."
                  className="h-8 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <select
                value={sortValue}
                onChange={(e) => onSortChange(e.target.value as "a-z" | "z-a")}
                className="h-8 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto"
              >
                <option value="a-z">A - Z</option>
                <option value="z-a">Z - A</option>
              </select>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="w-full text-left text-sm text-gray-500 underline transition hover:text-gray-700 sm:w-auto"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onAdd}
              className="w-full cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white transition hover:bg-blue-700 sm:w-auto"
            >
              Add School
            </button>
          </div>
        </div>
      </div>

      <div className="hidden max-h-[42vh] overflow-x-auto overflow-y-auto md:block sm:max-h-[50vh]">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-blue-100">
              <th className="px-3 py-1 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">
                Name
              </th>
              <th className="px-3 py-1 text-right text-xs font-semibold uppercase tracking-wide text-blue-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-3 py-1 text-sm font-medium text-gray-900">
                  {item.school_name}
                </td>
                <td className="px-3 py-1">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onDelete(item.id, item.school_name)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200"
                      aria-label="Delete school"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 min-h-0 p-3 md:hidden">
        {paginatedItems.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <p className="text-sm font-semibold text-gray-900">
              {item.school_name}
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onDelete(item.id, item.school_name)}
                className="inline-flex cursor-pointer items-center gap-1 rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200"
                aria-label="Delete school"
                title="Delete"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {items.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Show
              <select
                value={itemsPerPage}
                onChange={(event) => {
                  setItemsPerPage(Number(event.target.value));
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
                className="cursor-pointer rounded p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              {pageItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-sm text-gray-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`cursor-pointer h-9 w-9 rounded text-sm font-medium transition ${
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
                className="cursor-pointer rounded p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                onChange={(event) => setPageJumpInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleJumpToPage();
                  }
                }}
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
              />
              <button
                type="button"
                onClick={handleJumpToPage}
                className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
