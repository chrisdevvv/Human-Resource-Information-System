"use client";

import React from "react";
import { Menu } from "lucide-react";

type StickyHeaderProps = {
  onMenuClick?: () => void;
};

export default function StickyHeader({ onMenuClick }: StickyHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-blue-700 text-white py-4 px-6 shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="cursor-pointer p-2 rounded-md hover:bg-blue-600 transition"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <div>
          <p className="text-sm font-medium tracking-wide">
            DEPARTMENT OF EDUCATION
          </p>
          <h1 className="text-xl font-bold">
            Employee Leave Management System
          </h1>
        </div>
      </div>
    </header>
  );
}
