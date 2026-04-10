"use client";

import LookupManager from "./LookupManager";
import { Users } from "lucide-react";

export default function CivilStatus() {
  return (
    <LookupManager
      title="Civil Status"
      description="Manage civil status options shown in dropdown fields."
      endpoint="civil-statuses"
      itemKey="civil_status_name"
      singularLabel="Civil Status"
      searchPlaceholder="Search civil status..."
      icon={Users}
    />
  );
}
