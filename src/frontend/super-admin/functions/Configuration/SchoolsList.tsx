"use client";

import ListLayout from "./ListLayout";
import { Building2 } from "lucide-react";

type SchoolsListProps = {
  items: Array<{ id: number; school_name: string }>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onAdd: () => void;
  onDelete: (id: number, name: string) => void;
  sortValue: "a-z" | "z-a";
  onSortChange: (value: "a-z" | "z-a") => void;
};

export default function SchoolsList({
  items,
  searchValue,
  onSearchChange,
  hasActiveFilters,
  onClearFilters,
  onAdd,
  onDelete,
  sortValue,
  onSortChange,
}: SchoolsListProps) {
  return (
    <ListLayout
      title="Schools"
      description="Manage school options shown in dropdown fields."
      searchPlaceholder="Search schools..."
      addLabel="Add School"
      icon={Building2}
      items={items}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      onAdd={onAdd}
      onDelete={onDelete}
      sortValue={sortValue}
      onSortChange={onSortChange}
      getItemName={(item) => item.school_name}
    />
  );
}
