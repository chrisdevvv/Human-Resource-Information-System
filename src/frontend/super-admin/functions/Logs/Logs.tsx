"use client";

import React, { useState } from "react";
import { Archive, FileText } from "lucide-react";
import ActivityLogs from "./ActivityLogs";
import ArchivedLogs from "./ArchivedLogs";

type LogsTab = "activity" | "archived";

export default function Logs() {
  const [activeTab, setActiveTab] = useState<LogsTab>("activity");

  return (
    <div className="w-full min-w-0">
      <div className="grid grid-cols-2 gap-2 mb-4 sm:flex sm:flex-wrap sm:justify-start">
        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "activity"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <FileText size={16} />
            Activity Logs
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archived")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "archived"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <Archive size={16} />
            Archived Logs
          </span>
        </button>
      </div>

      {activeTab === "activity" ? <ActivityLogs /> : <ArchivedLogs />}
    </div>
  );
}
