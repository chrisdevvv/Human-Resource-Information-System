"use client";

import React from "react";

/**
 * Skeleton loader for the main shell layout (sidebar + header + content area)
 * Shows during initial auth verification and page load
 */
export function ShellSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="md:hidden">
        {/* Mobile Skeleton */}
        <div className="border-b border-gray-200 bg-white p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
          <div className="w-32 h-4 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="hidden md:flex min-h-screen items-stretch">
        {/* Desktop Sidebar Skeleton */}
        <div className="w-64 bg-blue-50 border-r border-gray-200 flex flex-col">
          {/* Logo area */}
          <div className="p-4 border-b border-gray-200">
            <div className="w-32 h-8 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
          </div>

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"
              />
            ))}
          </div>

          {/* Footer area */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="h-8 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col">
          {/* Header Skeleton */}
          <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
              <div className="w-40 h-6 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-32 h-6 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
          </div>

          {/* Page Content Skeleton */}
          <main className="flex-1 p-6 bg-gray-50">
            <div className="space-y-6">
              {/* Page Header */}
              <div className="space-y-2">
                <div className="w-64 h-8 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
                <div className="w-96 h-4 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
              </div>

              {/* Content Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg border border-gray-100 p-4 space-y-3"
                  >
                    <div className="w-8 h-8 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
                    <div className="w-24 h-4 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
                    <div className="w-32 h-6 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
                    <div className="w-20 h-3 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-40 h-6 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
                  <div className="w-28 h-10 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
