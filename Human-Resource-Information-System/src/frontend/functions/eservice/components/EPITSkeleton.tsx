"use client";

import React from "react";

export default function EPITSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      {/* Top Filters Skeleton */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="h-7 w-full animate-pulse rounded-lg bg-gray-100" />
          <div className="h-7 w-full animate-pulse rounded-lg bg-blue-100 sm:w-[90px]" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[170px_minmax(0,1fr)_140px_150px_92px]">
          <div className="h-7 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-7 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-7 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-7 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-7 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[1750px]">
            <div className="grid grid-cols-14 gap-0 bg-[#dbe8fb]">
              {Array.from({ length: 14 }).map((_, index) => (
                <div key={index} className="px-3 py-2.5">
                  <div className="h-3 w-16 animate-pulse rounded bg-blue-200" />
                </div>
              ))}
            </div>

            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-14 gap-0 border-t border-gray-200 bg-white"
              >
                {Array.from({ length: 14 }).map((__, colIndex) => (
                  <div key={colIndex} className="px-3 py-2.5">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <SkeletonField />
                <SkeletonField />
              </div>

              <SkeletonField />

              <div className="grid grid-cols-2 gap-3">
                <SkeletonField />
                <SkeletonField />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SkeletonField />
                <SkeletonField />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SkeletonField />
                <SkeletonField />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SkeletonField />
                <SkeletonField />
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-blue-100" />
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-red-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Pagination Skeleton */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-[#fafafa] px-3 py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="h-6 w-28 animate-pulse rounded bg-gray-100" />

          <div className="flex items-center justify-center gap-1">
            <div className="h-6 w-16 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-6 animate-pulse rounded bg-blue-100" />
            <div className="h-6 w-6 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-6 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-16 animate-pulse rounded bg-gray-100" />
          </div>

          <div className="h-6 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      </div>

      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-gray-100" />
    </div>
  );
}

type SkeletonFieldProps = {
  className?: string;
};

function SkeletonField({ className = "" }: SkeletonFieldProps) {
  return (
    <div className={className}>
      <div className="mb-1 h-3 w-20 animate-pulse rounded-md bg-gray-200" />
      <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
    </div>
  );
}