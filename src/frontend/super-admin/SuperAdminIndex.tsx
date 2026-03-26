"use client";

import React, { useRef } from "react";
import UserRoles from "./functions/UserRoles/UserRoles";
import UserRolesMobile from "./functions/UserRoles/UserRolesMobile";
import Logs from "./functions/Logs/Logs";
import LogsMobile from "./functions/Logs/LogsMobile";
import SuperAdminProfileSettings from "./functions/SuperAdminProfileSettings";
import ConfigurationPage from "./functions/Configuration/page";
import EmployeeLeaveManagement from "../functions/LeaveManagement/EmployeeLeaveManagement";
import Dashboard from "../functions/Dashboard/Dashboard";
import DashboardMobile from "../functions/Dashboard/DashboardMobile";
import styles from "./styles.module.css";

type SuperAdminProps = {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
};

export default function SuperAdmin({
  activeTab = "dashboard",
  onTabChange,
}: SuperAdminProps) {
  // Increase tab key only when the selected tab changes so that tab content
  // remounts and re-fetches fresh data on every tab re-entry.
  const tabVisitCounts = useRef<Record<string, number>>({});
  const lastActiveTab = useRef<string>(activeTab);

  if (lastActiveTab.current !== activeTab) {
    tabVisitCounts.current[activeTab] =
      (tabVisitCounts.current[activeTab] ?? 0) + 1;
    lastActiveTab.current = activeTab;
  }

  const tabKey = `${activeTab}-${tabVisitCounts.current[activeTab] ?? 0}`;

  const renderContent = () => {
    switch (activeTab) {
      case "employee-management":
        return <EmployeeLeaveManagement key={tabKey} />;
      case "user-roles":
        return (
          <>
            <div className="hidden md:block">
              <UserRoles key={tabKey} />
            </div>
            <div className="block md:hidden">
              <UserRolesMobile key={tabKey} />
            </div>
          </>
        );
      case "logs":
        return (
          <>
            <div className="hidden md:block">
              <Logs key={tabKey} />
            </div>
            <div className="block md:hidden">
              <LogsMobile key={tabKey} />
            </div>
          </>
        );
      case "configuration":
        return <ConfigurationPage key={tabKey} />;
      case "profile-settings":
        return <SuperAdminProfileSettings key={tabKey} />;
      default:
        return (
          <>
            <div className="hidden md:block">
              <Dashboard key={tabKey} onTabChange={onTabChange} />
            </div>
            <div className="block md:hidden">
              <DashboardMobile key={tabKey} onTabChange={onTabChange} />
            </div>
          </>
        );
    }
  };

  return <div>{renderContent()}</div>;
}
