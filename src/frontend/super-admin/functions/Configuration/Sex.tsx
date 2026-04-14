"use client";

import LookupManager from "./LookupManager";
import { Users } from "lucide-react";

export default function Sex() {
  return (
    <LookupManager
      title="Sex"
      description="Manage sex options shown in dropdown fields."
      endpoint="sexes"
      itemKey="sex_name"
      singularLabel="Sex"
      searchPlaceholder="Search sex..."
      icon={Users}
    />
  );
}
