"use client";

import React from "react";
import { ListChecks, Search, Trash2, ArrowUpAZ } from "lucide-react";

type ParticularsListProps = {
  items: Array<{ id: number | string; name: string }>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: number | string, name: string) => void;
  sortValue: "a-z" | "z-a";
  onSortChange: (value: "a-z" | "z-a") => void;
};

export default function ParticularsList({
  items,
  searchValue,
  onSearchChange,
  onAdd,
  onDelete,
  sortValue,
  onSortChange,
}: ParticularsListProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <ListChecks size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Particulars</h2>
              <p className="text-sm text-gray-500">
                Manage particulars used in leave dropdown fields.
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
                  placeholder="Search particulars..."
                  className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <select
                value={sortValue}
                onChange={(e) => onSortChange(e.target.value as "a-z" | "z-a")}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto"
              >
                <option value="a-z">A - Z</option>
                <option value="z-a">Z - A</option>
              </select>
            </div>
            <button
              type="button"
              onClick={onAdd}
              className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition hover:bg-blue-700 sm:w-auto"
            >
              Add Particular
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-600 sm:px-6">
                Name
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-blue-600 sm:px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sm:px-6">
                  {item.name}
                </td>
                <td className="px-4 py-3 sm:px-6">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onDelete(item.id, item.name)}
                      className="cursor-pointer rounded-md bg-red-100 p-2 text-red-700 transition hover:bg-red-200"
                      aria-label="Delete particular"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onDelete(item.id, item.name)}
                className="cursor-pointer rounded-md bg-red-100 p-2 text-red-700 transition hover:bg-red-200"
                aria-label="Delete particular"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
