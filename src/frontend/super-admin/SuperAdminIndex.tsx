"use client";

import React from "react";
import UserRoles from "./functions/UserRoles";
import styles from "./styles.module.css";

type SuperAdminProps = {
  activeTab?: string;
};

export default function SuperAdmin({
  activeTab = "dashboard",
}: SuperAdminProps) {
  const renderContent = () => {
    switch (activeTab) {
      case "user-roles":
        return <UserRoles />;
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
