"use client";

import React from "react";

type LoadingAnimationProps = {
  label?: string;
  fullScreen?: boolean;
};

export default function LoadingAnimation({
  label = "Loading...",
  fullScreen = true,
}: LoadingAnimationProps) {
  return (
    <div
      className={
        fullScreen
          ? "fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-[1px]"
          : "flex items-center justify-center"
      }
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400" />
        </div>

        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
          <span>{label}</span>
          <span className="animate-bounce [animation-delay:0ms]">.</span>
          <span className="animate-bounce [animation-delay:120ms]">.</span>
          <span className="animate-bounce [animation-delay:240ms]">.</span>
        </div>
      </div>
    </div>
  );
}
