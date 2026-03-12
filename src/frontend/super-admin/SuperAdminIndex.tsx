"use client";

import React, { useRef } from "react";
import UserRoles from "./functions/UserRoles";
import UserRolesMobile from "./functions/UserRolesMobile";
import Logs from "./functions/Logs";
import LogsMobile from "./functions/LogsMobile";
import SuperAdminProfileSettings from "./functions/SuperAdminProfileSettings";
import styles from "./styles.module.css";

type SuperAdminProps = {
  activeTab?: string;
};

export default function SuperAdmin({
  activeTab = "dashboard",
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
      case "profile-settings":
        return <SuperAdminProfileSettings key={tabKey} />;
      default:
        return (
          <div className={styles.container}>
            <h1>Super Admin Dashboard</h1>
            <p>Welcome to the Super Admin dashboard.</p>
          </div>
        );
    }
  };

  return <div>{renderContent()}</div>;
}
