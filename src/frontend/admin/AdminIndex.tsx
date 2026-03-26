import React, { useRef } from "react";
import styles from "./styles.module.css";
import AdminProfileSettings from "./functions/AdminProfileSettings";
import AdminUserRoles from "./functions/AdminUserRoles";
import EmployeeLeaveManagement from "../functions/LeaveManagement/EmployeeLeaveManagement";
import Dashboard from "../functions/Dashboard/Dashboard";
import DashboardMobile from "../functions/Dashboard/DashboardMobile";

type AdminProps = {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
};

export default function Admin({
  activeTab = "dashboard",
  onTabChange,
}: AdminProps) {
  const tabVisitCounts = useRef<Record<string, number>>({});
  const lastActiveTab = useRef<string>(activeTab);

  if (lastActiveTab.current !== activeTab) {
    tabVisitCounts.current[activeTab] =
      (tabVisitCounts.current[activeTab] ?? 0) + 1;
    lastActiveTab.current = activeTab;
  }

  const tabKey = `${activeTab}-${tabVisitCounts.current[activeTab] ?? 0}`;

  switch (activeTab) {
    case "employee-management":
      return <EmployeeLeaveManagement key={tabKey} />;
    case "user-roles":
      return <AdminUserRoles key={tabKey} />;
    case "profile-settings":
      return <AdminProfileSettings key={tabKey} />;
    default:
      return (
        <>
          <div className="hidden md:block">
            <Dashboard
              key={tabKey}
              onTabChange={onTabChange}
              showRecentLogs={false}
            />
          </div>
          <div className="block md:hidden">
            <DashboardMobile
              key={tabKey}
              onTabChange={onTabChange}
              showRecentLogs={false}
            />
          </div>
        </>
      );
  }
}
