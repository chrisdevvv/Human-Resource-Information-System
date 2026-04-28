"use client";


import React from "react";

type DashboardSkeletonProps = {
  showRecentLogs?: boolean;
};

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div
    className={`animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 ${className}`}
  />
);

const DesktopStatCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm ring-1 ring-gray-100">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-10 w-20" />
        <Skeleton className="mt-3 h-4 w-40" />
      </div>

      <Skeleton className="h-14 w-14 rounded-2xl" />
    </div>

    <div className="mt-6 flex items-center justify-between border-t border-gray-200/70 pt-4">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
  </div>
);

const MobileStatCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-8 w-14" />
      </div>
      <Skeleton className="h-8 w-8 rounded-xl" />
    </div>

    <div className="mt-3 flex items-center justify-between border-t border-gray-200/70 pt-2.5">
      <Skeleton className="h-2.5 w-10" />
      <Skeleton className="h-3.5 w-3.5 rounded-full" />
    </div>
  </div>
);

const DesktopLogRowSkeleton = () => (
  <tr className="border-b border-gray-100">
    <td className="px-4 py-3">
      <Skeleton className="h-4 w-32" />
    </td>
    <td className="px-4 py-3">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-4 py-3">
      <Skeleton className="h-6 w-24 rounded-full" />
    </td>
    <td className="px-4 py-3">
      <Skeleton className="h-4 w-56" />
    </td>
  </tr>
);

const MobileLogCardSkeleton = () => (
  <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white px-3 py-3 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>

    <Skeleton className="mt-3 h-3 w-full" />
    <Skeleton className="mt-2 h-3 w-5/6" />
  </div>
);

export default function DashboardSkeleton({
  showRecentLogs = true,
}: DashboardSkeletonProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      {/* ================= DESKTOP / TABLET SKELETON ================= */}
      <div className="hidden md:block">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/85 px-6 py-6 backdrop-blur-md">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-2xl" />
                  <Skeleton className="h-8 w-40" />
                </div>
                <Skeleton className="mt-3 h-4 w-72" />
              </div>

              <Skeleton className="h-10 w-36 rounded-full" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl p-6">
          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <DesktopStatCardSkeleton key={index} />
            ))}
          </div>

          {showRecentLogs && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="mt-2 h-4 w-44" />
                </div>

                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-205 border-collapse text-sm">
                  <thead className="bg-blue-100/90">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left">
                        <Skeleton className="h-3 w-24" />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <Skeleton className="h-3 w-16" />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <Skeleton className="h-3 w-24" />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <Skeleton className="h-3 w-20" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <DesktopLogRowSkeleton key={index} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE SKELETON ================= */}
      <div className="md:hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/90 px-3 py-3 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="mt-2 h-3 w-24" />
            </div>

            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4 p-3">
          {/* Stats */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-14" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <MobileStatCardSkeleton key={index} />
              ))}
            </div>
          </div>

          {showRecentLogs && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-white px-3 py-3">
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-1.5 h-3 w-20" />
                </div>

                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>

              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <MobileLogCardSkeleton key={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}