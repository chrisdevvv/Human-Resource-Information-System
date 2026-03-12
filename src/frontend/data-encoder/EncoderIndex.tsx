import React from "react";
import styles from "./styles.module.css";
import DataEncoderProfileSettings from "./functions/DataEncoderProfileSettings";

type DataEncoderProps = {
  activeTab?: string;
};

export default function DataEncoder({
  activeTab = "dashboard",
}: DataEncoderProps) {
  switch (activeTab) {
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
