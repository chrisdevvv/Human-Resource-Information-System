"use client";

import React from "react";

/**
 * Reusable skeleton components for consistent loading states across the system.
 * All components use CSS-based gradient animation for performance.
 */

// Base skeleton line component
export const SkeletonLine = ({
  width = "w-full",
  height = "h-4",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <div
    className={`${width} ${height} bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse ${className}`}
  />
);

// Reusable skeleton block
export const SkeletonBlock = ({
  width = "w-full",
  height = "h-20",
  className = "",
  rounded = "rounded-lg",
}: {
  width?: string;
  height?: string;
  className?: string;
  rounded?: string;
}) => (
  <div
    className={`${width} ${height} bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 ${rounded} animate-pulse ${className}`}
  />
);

// Avatar skeleton
export const SkeletonAvatar = ({
  size = "w-10 h-10",
  className = "",
}: {
  size?: string;
  className?: string;
}) => (
  <div
    className={`${size} bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse ${className}`}
  />
);

// Generic table row skeleton
export const SkeletonTableRow = ({
  columns = 4,
  colWidths,
}: {
  columns?: number;
  colWidths?: string[];
}) => (
  <tr className="border-b border-gray-100">
    {Array.from({ length: columns }).map((_, idx) => (
      <td key={idx} className="px-3 py-3">
        <SkeletonLine width={colWidths?.[idx] || "w-full"} height="h-3" />
      </td>
    ))}
  </tr>
);

// Form field skeleton
export const SkeletonFormField = ({
  includeLabel = true,
  className = "",
}: {
  includeLabel?: boolean;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    {includeLabel && <SkeletonLine width="w-24" height="h-3" />}
    <SkeletonBlock width="w-full" height="h-10" rounded="rounded" />
  </div>
);

// Button skeleton
export const SkeletonButton = ({
  width = "w-24",
  className = "",
}: {
  width?: string;
  className?: string;
}) => (
  <SkeletonBlock
    width={width}
    height="h-10"
    rounded="rounded-md"
    className={className}
  />
);

// Card skeleton
export const SkeletonCard = ({ className = "" }: { className?: string }) => (
  <div
    className={`bg-white border border-blue-200 rounded-lg p-6 ${className}`}
  >
    <div className="space-y-4">
      <SkeletonLine width="w-32" height="h-4" />
      <SkeletonLine width="w-full" height="h-8" />
      <SkeletonLine width="w-48" height="h-3" />
    </div>
  </div>
);

// Modal header skeleton
export const SkeletonModalHeader = () => (
  <div className="flex items-center justify-between mb-4">
    <SkeletonLine width="w-40" height="h-6" />
    <SkeletonBlock width="w-6" height="h-6" rounded="rounded" />
  </div>
);

// Profile section skeleton (avatar + text)
export const SkeletonProfile = () => (
  <div className="flex items-start gap-4">
    <SkeletonAvatar size="w-16 h-16" />
    <div className="flex-1 space-y-3">
      <SkeletonLine width="w-40" height="h-4" />
      <SkeletonLine width="w-32" height="h-3" />
      <SkeletonLine width="w-48" height="h-3" />
    </div>
  </div>
);

// List item skeleton
export const SkeletonListItem = ({
  includeIcon = true,
  includeAvatar = false,
}: {
  includeIcon?: boolean;
  includeAvatar?: boolean;
}) => (
  <div className="flex items-start gap-3 p-3 border-b border-gray-100">
    {includeIcon && (
      <SkeletonBlock width="w-4" height="h-4" rounded="rounded" />
    )}
    {includeAvatar && <SkeletonAvatar size="w-8 h-8" />}
    <div className="flex-1 space-y-2">
      <SkeletonLine width="w-32" height="h-3" />
      <SkeletonLine width="w-48" height="h-2.5" />
    </div>
  </div>
);

// Header with title and subtitle
export const SkeletonPageHeader = () => (
  <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-8">
    <div className="space-y-3">
      <SkeletonLine width="w-48" height="h-8" />
      <SkeletonLine width="w-96" height="h-4" />
    </div>
  </div>
);

// Chart/graph placeholder
export const SkeletonChart = ({ height = "h-64" }: { height?: string }) => (
  <SkeletonBlock width="w-full" height={height} rounded="rounded-lg" />
);

// Generic section with rows
export const SkeletonSection = ({
  rows = 5,
  columns = 4,
  title = true,
}: {
  rows?: number;
  columns?: number;
  title?: boolean;
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    {title && <SkeletonLine width="w-32" height="h-6" className="mb-4" />}
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-blue-100">
          <tr className="border-b-2 border-gray-200">
            {Array.from({ length: columns }).map((_, idx) => (
              <th key={idx} className="px-3 py-2 text-left">
                <SkeletonLine width="w-16" height="h-3" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <SkeletonTableRow key={rowIdx} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
