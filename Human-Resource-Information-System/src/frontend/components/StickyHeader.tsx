"use client";

import React from "react";

type StickyHeaderProps = {
  onMenuClick?: () => void;
  isSidebarCollapsed?: boolean;
};

export default function StickyHeader({
  isSidebarCollapsed = false,
}: StickyHeaderProps) {
  const sidebarOffsetClass = isSidebarCollapsed ? "md:left-16" : "md:left-64";

  return (
    <>
      <div
        className={`fixed top-0 right-0 z-30 w-full transition-[left] duration-300 ${sidebarOffsetClass}`}
      >
        <header className="w-full bg-blue-700 px-6 py-4 text-white shadow-md">
          <div className="flex items-center">
            <div>
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-blue-100">
                DEPARTMENT OF EDUCATION
              </p>

              <h1 className="text-lg sm:text-2xl font-bold leading-tight">
                CITY OF SAN JOSE DEL MONTE
              </h1>

              <p className="text-xs sm:text-sm font-medium leading-tight text-blue-100">
                CSJDM Human Resource Information System - CHRIS
              </p>
            </div>
          </div>
        </header>
      </div>

      {/* Spacer to preserve layout flow while header is fixed */}
      <div aria-hidden className="h-23 sm:h-26 w-full shrink-0" />
    </>
  );
}
