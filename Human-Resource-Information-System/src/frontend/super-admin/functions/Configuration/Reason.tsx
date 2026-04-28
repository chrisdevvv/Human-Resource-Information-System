"use client";

import LookupManager from "./LookupManager";
import { Archive } from "lucide-react";

export default function ReasonDeactivate() {
  return (
    <LookupManager
      title="Reason (Deactivate)"
      description="Manage employee deactivation reasons shown in dropdown fields."
      endpoint="archiving-reasons"
      itemKey="reason_name"
      singularLabel="Reason"
      searchPlaceholder="Search reasons..."
      icon={Archive}
    />
  );
}
