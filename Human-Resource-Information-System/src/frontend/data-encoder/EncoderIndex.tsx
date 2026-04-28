import React from "react";
import styles from "./styles.module.css";
import DataEncoderProfileSettings from "./functions/DataEncoderProfileSettings";
import EmployeeLeaveManagement from "../functions/LeaveManagement/EmployeeLeaveManagement";

type DataEncoderProps = {
  activeTab?: string;
};

export default function DataEncoder({
  activeTab = "dashboard",
}: DataEncoderProps) {
  switch (activeTab) {
    case "employee-management":
      return <EmployeeLeaveManagement />;
    case "profile-settings":
      return <DataEncoderProfileSettings />;
    default:
      return (
        <div className={styles.container}>
          <h1>Data Encoder</h1>
          <p>Placeholder area for data-encoder interfaces.</p>
        </div>
      );
  }
}
