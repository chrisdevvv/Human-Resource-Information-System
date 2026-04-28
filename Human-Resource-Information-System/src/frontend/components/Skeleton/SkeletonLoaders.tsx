"use client";

import React from "react";
import {
  SkeletonLine,
  SkeletonBlock,
  SkeletonPageHeader,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonListItem,
  SkeletonSection,
  SkeletonFormField,
} from "./SkeletonUtils";

export function AdminDashboardSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <SkeletonPageHeader />

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock
              key={i}
              width="w-32"
              height="h-10"
              rounded="rounded-lg"
            />
          ))}
        </div>

        {/* Content area - mimics active tab content */}
        <div className="space-y-6">
          {/* Section header with button */}
          <div className="flex items-center justify-between">
            <SkeletonLine width="w-40" height="h-6" />
            <SkeletonBlock width="w-32" height="h-10" rounded="rounded-md" />
          </div>

          {/* Main content card grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfigurationSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <SkeletonPageHeader />

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Filter/Search bar */}
        <div className="flex gap-3">
          <SkeletonBlock width="w-64" height="h-10" rounded="rounded" />
          <SkeletonBlock width="w-32" height="h-10" rounded="rounded-md" />
        </div>

        {/* Table section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <SkeletonLine width="w-40" height="h-6" />
            <SkeletonBlock width="w-28" height="h-10" rounded="rounded-md" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-100">
                <tr className="border-b-2 border-gray-200">
                  <th className="px-3 py-2 text-left">
                    <SkeletonLine width="w-20" height="h-3" />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SkeletonLine width="w-24" height="h-3" />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SkeletonLine width="w-16" height="h-3" />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SkeletonLine width="w-20" height="h-3" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonTableRow
                    key={i}
                    columns={4}
                    colWidths={["w-20", "w-24", "w-16", "w-20"]}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeaveHistorySkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <SkeletonPageHeader />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Employee info header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="space-y-3">
            <SkeletonLine width="w-48" height="h-5" />
            <SkeletonLine width="w-64" height="h-4" />
            <SkeletonLine width="w-56" height="h-4" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <SkeletonBlock width="w-40" height="h-10" rounded="rounded" />
          <SkeletonBlock width="w-40" height="h-10" rounded="rounded" />
          <SkeletonBlock width="w-32" height="h-10" rounded="rounded-md" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-100">
                <tr className="border-b-2 border-gray-200">
                  {["Date", "Type", "Days", "Status", "Action"].map((col) => (
                    <th key={col} className="px-3 py-2 text-left">
                      <SkeletonLine width="w-20" height="h-3" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={5} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LogsReportSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <SkeletonPageHeader />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filter options */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <SkeletonLine width="w-32" height="h-5" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonLine width="w-24" height="h-3" />
                <SkeletonBlock width="w-full" height="h-10" rounded="rounded" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <SkeletonBlock width="w-32" height="h-10" rounded="rounded-md" />
            <SkeletonBlock width="w-28" height="h-10" rounded="rounded-md" />
          </div>
        </div>

        {/* Results table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <SkeletonLine width="w-48" height="h-6" />
            <SkeletonBlock width="w-32" height="h-10" rounded="rounded-md" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-100">
                <tr className="border-b-2 border-gray-200">
                  {["Timestamp", "User", "Action", "Details", "Status"].map(
                    (col) => (
                      <th key={col} className="px-3 py-2 text-left">
                        <SkeletonLine width="w-20" height="h-3" />
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={5} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <SkeletonLine width="w-48" height="h-3" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonBlock
                  key={i}
                  width="w-8"
                  height="h-8"
                  rounded="rounded"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GenericFormModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <SkeletonLine width="w-40" height="h-6" />
          <SkeletonBlock width="w-6" height="h-6" rounded="rounded" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonLine width="w-24" height="h-3" />
              <SkeletonBlock width="w-full" height="h-10" rounded="rounded" />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6 justify-end">
          <SkeletonBlock width="w-20" height="h-10" rounded="rounded-md" />
          <SkeletonBlock width="w-20" height="h-10" rounded="rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function UserTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <SkeletonLine width="w-32" height="h-6" />
        <SkeletonBlock width="w-28" height="h-10" rounded="rounded-md" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-100">
            <tr className="border-b-2 border-gray-200">
              {["Name", "Email", "Role", "School", "Status", "Action"].map(
                (col) => (
                  <th key={col} className="px-3 py-2 text-left">
                    <SkeletonLine width="w-20" height="h-3" />
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} columns={6} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmployeesProfileSkeleton() {
  return (
    <div className="w-full min-w-0">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-start">
        <SkeletonBlock
          width="w-full sm:w-36"
          height="h-10"
          rounded="rounded-lg"
        />
        <SkeletonBlock
          width="w-full sm:w-36"
          height="h-10"
          rounded="rounded-lg"
        />
      </div>

      <div className="w-full min-w-0 bg-white rounded-lg shadow-lg p-2 sm:p-3 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonLine width="w-56" height="h-6" />
          <SkeletonBlock width="w-32" height="h-10" rounded="rounded-md" />
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SkeletonBlock width="w-full" height="h-10" rounded="rounded-lg" />
            <SkeletonBlock width="w-32" height="h-10" rounded="rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock
                key={i}
                width="w-full sm:w-36"
                height="h-10"
                rounded="rounded-lg"
              />
            ))}
          </div>
        </div>

        <SkeletonSection rows={6} columns={6} title={false} />
      </div>
    </div>
  );
}

export function LeaveManagementSkeleton() {
  return (
    <div className="w-full min-w-0">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-start">
        <SkeletonBlock
          width="w-full sm:w-36"
          height="h-10"
          rounded="rounded-lg"
        />
        <SkeletonBlock
          width="w-full sm:w-36"
          height="h-10"
          rounded="rounded-lg"
        />
      </div>

      <div className="w-full min-w-0 bg-white rounded-lg shadow-lg p-2 sm:p-3 flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonLine width="w-64" height="h-6" />
          <SkeletonBlock width="w-32" height="h-10" rounded="rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock
              key={i}
              width="w-full sm:w-40"
              height="h-10"
              rounded="rounded-lg"
            />
          ))}
        </div>

        <SkeletonSection rows={8} columns={8} title={false} />
      </div>
    </div>
  );
}

export function ActivityLogsSkeleton() {
  return (
    <div className="w-full min-w-0 bg-white rounded-lg shadow-lg p-2 sm:p-3 flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonLine width="w-56" height="h-6" />
        <SkeletonBlock width="w-32" height="h-10" rounded="rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock
            key={i}
            width="w-full sm:w-40"
            height="h-10"
            rounded="rounded-lg"
          />
        ))}
      </div>

      <SkeletonSection rows={8} columns={5} title={false} />
    </div>
  );
}

export function ActivityLogsMobileSkeleton() {
  return (
    <div className="border border-blue-200 bg-white rounded-xl shadow-lg p-4 flex flex-col gap-4">
      <div className="space-y-3">
        <SkeletonLine width="w-48" height="h-6" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock
              key={i}
              width="w-full"
              height="h-10"
              rounded="rounded-lg"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonListItem key={i} includeIcon={false} includeAvatar={false} />
        ))}
      </div>
    </div>
  );
}

export function MonthlyCreditSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonLine width="w-24" height="h-3" />
            <SkeletonBlock width="w-full" height="h-10" rounded="rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <SkeletonBlock
          width="w-full sm:w-24"
          height="h-10"
          rounded="rounded-md"
        />
        <SkeletonBlock
          width="w-full sm:w-36"
          height="h-10"
          rounded="rounded-md"
        />
        <SkeletonBlock
          width="w-full sm:w-40"
          height="h-10"
          rounded="rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 space-y-2">
            <SkeletonLine width="w-48" height="h-4" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <SkeletonBlock
                width="w-full"
                height="h-10"
                rounded="rounded-md"
              />
              <SkeletonBlock
                width="w-full"
                height="h-10"
                rounded="rounded-md"
              />
              <SkeletonBlock
                width="w-full"
                height="h-10"
                rounded="rounded-md"
              />
            </div>
          </div>
          <div className="p-2 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonListItem
                key={i}
                includeIcon={false}
                includeAvatar={false}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 space-y-2">
            <SkeletonLine width="w-40" height="h-4" />
            <SkeletonLine width="w-32" height="h-3" />
          </div>
          <div className="p-2 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonListItem
                key={i}
                includeIcon={false}
                includeAvatar={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArchivedLogsSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-blue-200 bg-white p-4 shadow-lg">
      <div className="space-y-3">
        <SkeletonLine width="w-56" height="h-6" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock
              key={i}
              width="w-full"
              height="h-10"
              rounded="rounded-md"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-100 bg-gray-50 p-3"
          >
            <SkeletonLine width="w-32" height="h-3" />
            <div className="mt-2 space-y-2">
              <SkeletonLine width="w-48" height="h-4" />
              <SkeletonLine width="w-full" height="h-3" />
            </div>
            <div className="mt-3 flex justify-end">
              <SkeletonBlock width="w-16" height="h-8" rounded="rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSettingsSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-blue-200 bg-white p-4 shadow-lg sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonLine width="w-56" height="h-7" />
          <SkeletonLine width="w-80" height="h-4" />
        </div>
        <SkeletonBlock width="w-36" height="h-10" rounded="rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonFormField key={i} />
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <SkeletonBlock width="w-24" height="h-10" rounded="rounded-md" />
        <SkeletonBlock width="w-28" height="h-10" rounded="rounded-md" />
      </div>
    </div>
  );
}

export function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-between bg-blue-600 p-10 text-white">
            <div className="space-y-4">
              <SkeletonLine
                width="w-56"
                height="h-10"
                className="bg-white/30"
              />
              <SkeletonLine width="w-80" height="h-4" className="bg-white/30" />
              <SkeletonLine width="w-72" height="h-4" className="bg-white/30" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonLine
                  key={i}
                  width="w-full"
                  height="h-4"
                  className="bg-white/30"
                />
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              <SkeletonLine width="w-40" height="h-8" />
              <SkeletonLine width="w-64" height="h-4" />

              <div className="space-y-4">
                <SkeletonFormField />
                <SkeletonFormField />
              </div>

              <SkeletonBlock
                width="w-full"
                height="h-12"
                rounded="rounded-xl"
              />

              <div className="flex items-center justify-between gap-3">
                <SkeletonLine width="w-24" height="h-4" />
                <SkeletonLine width="w-28" height="h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InlineModalSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SkeletonLine width="w-44" height="h-6" />
        <SkeletonBlock width="w-10" height="h-10" rounded="rounded-xl" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <SkeletonFormField key={i} />
        ))}
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <SkeletonBlock width="w-24" height="h-10" rounded="rounded-md" />
        <SkeletonBlock width="w-28" height="h-10" rounded="rounded-md" />
      </div>
    </div>
  );
}
