"use client";

import React from "react";

type StickyHeaderProps = {
  onMenuClick?: () => void;
};

export default function StickyHeader(_: StickyHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-blue-700 text-white py-4 px-6 shadow-md">
      <div className="flex items-center">
        <div>
          <p className="text-sm font-medium tracking-wide">
            DEPARTMENT OF EDUCATION
          </p>
          <h1 className="text-xl font-bold">
            Human Resource Information System
          </h1>
        </div>
      </div>
    </header>
  );
}
