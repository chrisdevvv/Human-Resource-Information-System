"use client";

import LookupManager from "./LookupManager";
import { MapPinned } from "lucide-react";

export default function District() {
  return (
    <LookupManager
      title="District"
      description="Manage district options shown in dropdown fields."
      endpoint="districts"
      itemKey="district_name"
      singularLabel="District"
      searchPlaceholder="Search districts..."
      icon={MapPinned}
    />
  );
}
