"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import SuccessMessage from "./SuccessMessage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type LookupItem = {
  id: number;
  [key: string]: unknown;
};

type LookupManagerProps = {
  title: string;
  description: string;
  endpoint: string;
  itemKey: string;
  singularLabel: string;
  searchPlaceholder: string;
  icon: LucideIcon;
};

type LookupResponse = {
  data?: LookupItem[];
  message?: string;
};

const getItemLabel = (item: LookupItem, itemKey: string) => {
  const value = item[itemKey];
  return typeof value === "string" ? value : "";
};

export default function LookupManager({
  title,
  description,
  endpoint,
  itemKey,
  singularLabel,
  searchPlaceholder,
  icon: Icon,
}: LookupManagerProps) {
  const [items, setItems] = useState<LookupItem[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<"a-z" | "z-a">("a-z");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
  const [pageJumpInput, setPageJumpInput] = useState("1");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entryValue, setEntryValue] = useState("");
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<LookupItem | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackVariant, setFeedbackVariant] = useState<"success" | "error">(
    "success",
  );

  const showFeedback = (variant: "success" | "error", message: string) => {
    setFeedbackVariant(variant);
    setFeedbackMessage(message);
    setFeedbackVisible(true);
  };

  const loadItems = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setIsLoading(true);
      }

      setError(null);
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No auth token found. Please login.");
      }

      const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const body = (await response.json().catch(() => ({}))) as LookupResponse;

      if (!response.ok) {
        throw new Error(
          body.message ||
            `Failed to load ${singularLabel.toLowerCase()} options`,
        );
      }

      setItems(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to load ${singularLabel.toLowerCase()} options`,
      );
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    const results = query
      ? items.filter((item) =>
          getItemLabel(item, itemKey).toLowerCase().includes(query),
        )
      : items;

    return [...results].sort((a, b) => {
      const aLabel = getItemLabel(a, itemKey);
      const bLabel = getItemLabel(b, itemKey);
      return sortValue === "a-z"
        ? aLabel.localeCompare(bLabel)
        : bLabel.localeCompare(aLabel);
    });
  }, [itemKey, items, searchValue, sortValue]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage),
  );

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
    return filteredItems.slice(start, start + itemsPerPage);
  }, [currentPage, filteredItems, itemsPerPage]);

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

  const openAddModal = () => {
    setEntryValue("");
    setError(null);
    setShowEntryModal(true);
  };

  const requestAdd = () => {
    const trimmed = entryValue.trim();
    if (!trimmed) {
      showFeedback("error", `Please enter a ${singularLabel.toLowerCase()}.`);
      return;
    }

    setError(null);
    setShowAddConfirm(true);
  };

  const confirmAdd = async () => {
    const trimmed = entryValue.trim();
    if (!trimmed) {
      setShowAddConfirm(false);
      setShowEntryModal(false);
      showFeedback("error", `Please enter a ${singularLabel.toLowerCase()}.`);
      return;
    }

    setShowAddConfirm(false);
    setShowEntryModal(false);

    try {
      setIsSaving(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No auth token found. Please login.");
      }

      const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [itemKey]: trimmed }),
      });

      const body = (await response.json().catch(() => ({}))) as LookupResponse;
      if (!response.ok) {
        throw new Error(
          body.message || `Failed to add ${singularLabel.toLowerCase()}`,
        );
      }

      setEntryValue("");
      showFeedback("success", `${singularLabel} added successfully.`);
      await loadItems(false);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error
          ? err.message
          : `Failed to add ${singularLabel.toLowerCase()}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (item: LookupItem) => {
    setPendingDelete(item);
    setError(null);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    const target = pendingDelete;
    setShowDeleteConfirm(false);
    setPendingDelete(null);

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No auth token found. Please login.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/${endpoint}/${target.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const body = (await response.json().catch(() => ({}))) as LookupResponse;
      if (!response.ok) {
        throw new Error(
          body.message || `Failed to delete ${singularLabel.toLowerCase()}`,
        );
      }

      showFeedback("success", `${singularLabel} deleted successfully.`);
      await loadItems(false);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error
          ? err.message
          : `Failed to delete ${singularLabel.toLowerCase()}`,
      );
    } finally {
      setIsDeleting(false);
    }
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

  const hasActiveFilters = searchValue.trim().length > 0 || sortValue !== "a-z";

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Icon size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:w-full sm:flex sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
            <div className="col-span-2 grid w-full grid-cols-2 gap-2 sm:col-span-1 sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-1.5">
              <div className="relative col-span-2 w-full sm:w-64 lg:w-80">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <select
                value={sortValue}
                onChange={(event) =>
                  setSortValue(event.target.value as "a-z" | "z-a")
                }
                className="h-8 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto"
              >
                <option value="a-z">A - Z</option>
                <option value="z-a">Z - A</option>
              </select>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("");
                    setSortValue("a-z");
                  }}
                  className="col-span-2 w-full text-right text-sm text-gray-500 underline transition hover:text-gray-700 sm:col-span-1 sm:w-auto sm:text-left cursor-pointer"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="col-span-2 w-full cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white transition hover:bg-blue-700 sm:col-span-1 sm:w-auto"
            >
              Add {singularLabel}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:m-6">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="m-4 h-full rounded-2xl border border-blue-200 bg-white p-8 text-center shadow-sm sm:m-6">
          <div className="inline-flex animate-spin">
            <div className="h-6 w-6 rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Loading {title.toLowerCase()}...
          </p>
        </div>
      ) : (
        <>
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
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => {
                    const label = getItemLabel(item, itemKey);

                    return (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="px-3 py-1 text-sm font-medium text-gray-900">
                          {label}
                        </td>
                        <td className="px-3 py-1">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => requestDelete(item)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200"
                              aria-label={`Delete ${label || singularLabel.toLowerCase()}`}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-500">
                      No {title.toLowerCase()} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 p-3 md:hidden">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => {
                const label = getItemLabel(item, itemKey);

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white p-3"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {label}
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => requestDelete(item)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200"
                        aria-label={`Delete ${label || singularLabel.toLowerCase()}`}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">
                No {title.toLowerCase()} found.
              </p>
            )}
          </div>

          {filteredItems.length > 0 && (
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
                    type="button"
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
                        type="button"
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
                    type="button"
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
                    className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-200"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showEntryModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Add {singularLabel}
                </h2>
                <p className="text-sm text-gray-500">
                  Enter the {singularLabel.toLowerCase()} name to add it to the
                  system.
                </p>
              </div>
            </div>
            <div className="space-y-4 px-5 py-4">
              <label className="block text-sm font-medium text-gray-700">
                {singularLabel} Name
                <input
                  type="text"
                  placeholder={`e.g., ${singularLabel}`}
                  value={entryValue}
                  onChange={(event) => setEntryValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isSaving) {
                      requestAdd();
                    }
                  }}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={isSaving}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowEntryModal(false);
                  setEntryValue("");
                }}
                className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={requestAdd}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Add
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Confirm Add {singularLabel}?
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Please confirm before saving this new item.
              </p>
            </div>
            <div className="space-y-3 px-5 py-4">
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                Are you sure you want to add{" "}
                <strong>{entryValue.trim()}</strong>?
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddConfirm(false);
                  setShowEntryModal(true);
                }}
                className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                disabled={isSaving}
              >
                <span className="inline-flex items-center gap-1">
                  <X size={14} />
                  Cancel
                </span>
              </button>
              <button
                type="button"
                onClick={confirmAdd}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  {isSaving ? "Saving..." : "Confirm Add"}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteConfirm && pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Delete {singularLabel}?
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </div>
            <div className="space-y-3 px-5 py-4">
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                Are you sure you want to delete{" "}
                <strong>{getItemLabel(pendingDelete, itemKey)}</strong>?
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPendingDelete(null);
                }}
                className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                disabled={isDeleting}
              >
                <span className="inline-flex items-center gap-1">
                  <X size={14} />
                  Cancel
                </span>
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Trash2 size={14} />
                    Delete
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SuccessMessage
        isVisible={feedbackVisible}
        message={feedbackMessage}
        variant={feedbackVariant}
        onClose={() => setFeedbackVisible(false)}
      />
    </section>
  );
}
