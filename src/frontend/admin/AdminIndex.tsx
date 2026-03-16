import React from "react";
import styles from "./styles.module.css";
import AdminProfileSettings from "./functions/AdminProfileSettings";
import EmployeeLeaveManagement from "../functions/EmployeeLeaveManagement";

type AdminProps = {
  activeTab?: string;
};

export default function Admin({ activeTab = "dashboard" }: AdminProps) {
  switch (activeTab) {
    case "employee-management":
      return <EmployeeLeaveManagement />;
    case "profile-settings":
      return <AdminProfileSettings />;
    default:
      return (
        <div className={styles.container}>
          <h1>Admin</h1>
          <p>Placeholder area for Admin pages and components.</p>
        </div>
      );
  }
}
