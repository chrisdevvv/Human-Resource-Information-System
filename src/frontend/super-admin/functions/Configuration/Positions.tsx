"use client";

import LookupManager from "./LookupManager";
import { Briefcase } from "lucide-react";

export default function Positions() {
  return (
    <LookupManager
      title="Positions"
      description="Manage position options shown in dropdown fields."
      endpoint="positions"
      itemKey="position_name"
      singularLabel="Position"
      searchPlaceholder="Search positions..."
      icon={Briefcase}
    />
  );
}
