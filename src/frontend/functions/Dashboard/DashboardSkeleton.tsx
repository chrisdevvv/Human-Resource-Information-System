"use client";

import React from "react";
import { LayoutDashboard } from "lucide-react";

type DashboardSkeletonProps = {
  showRecentLogs?: boolean;
};

const SkeletonLine = ({
  width = "w-full",
  height = "h-4",
}: {
  width?: string;
  height?: string;
}) => (
  <div
    className={`${width} ${height} bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse`}
  />
);

const SkeletonCard = () => (
  <div className="bg-white border border-blue-200 rounded-lg p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        {/* Title line */}
        <SkeletonLine width="w-32" height="h-3" />
        {/* Value line */}
        <SkeletonLine width="w-24" height="h-8" />
        {/* Subtitle line */}
        <SkeletonLine width="w-40" height="h-2.5" />
      </div>
      {/* Icon placeholder */}
      <div className="w-8 h-8 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
    </div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="border-b border-gray-100">
    <td className="px-3 py-3">
      <SkeletonLine width="w-32" height="h-3" />
    </td>
    <td className="px-3 py-3">
      <SkeletonLine width="w-24" height="h-3" />
    </td>
    <td className="px-3 py-3">
      <SkeletonLine width="w-28" height="h-3" />
    </td>
    <td className="px-3 py-3">
      <SkeletonLine width="w-40" height="h-3" />
    </td>
  </tr>
);

export default function DashboardSkeleton({
  showRecentLogs = true,
}: DashboardSkeletonProps) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="h-7 w-7 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
          <SkeletonLine width="w-32" height="h-8" />
        </div>
        <SkeletonLine width="w-96" height="h-4" />
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        {showRecentLogs && (
          <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
            {/* Title and Button */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <SkeletonLine width="w-32" height="h-6" />
              <SkeletonLine width="w-24" height="h-9" />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 border-collapse text-sm">
                <thead className="bg-blue-100">
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-3 py-1.5 text-left">
                      <SkeletonLine width="w-20" height="h-3" />
                    </th>
                    <th className="px-3 py-1.5 text-left">
                      <SkeletonLine width="w-16" height="h-3" />
                    </th>
                    <th className="px-3 py-1.5 text-left">
                      <SkeletonLine width="w-24" height="h-3" />
                    </th>
                    <th className="px-3 py-1.5 text-left">
                      <SkeletonLine width="w-20" height="h-3" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonTableRow key={index} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
