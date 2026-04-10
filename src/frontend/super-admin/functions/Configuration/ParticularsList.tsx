"use client";

import ListLayout from "./ListLayout";
import { ListChecks } from "lucide-react";

type ParticularsListProps = {
  items: Array<{ id: number | string; name: string }>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onAdd: () => void;
  onDelete: (id: number | string, name: string) => void;
  sortValue: "a-z" | "z-a";
  onSortChange: (value: "a-z" | "z-a") => void;
};

export default function ParticularsList({
  items,
  searchValue,
  onSearchChange,
  hasActiveFilters,
  onClearFilters,
  onAdd,
  onDelete,
  sortValue,
  onSortChange,
}: ParticularsListProps) {
  return (
    <ListLayout
      title="Particulars"
      description="Manage particulars used in leave dropdown fields."
      searchPlaceholder="Search particulars..."
      addLabel="Add Particular"
      icon={ListChecks}
      items={items}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      onAdd={onAdd}
      onDelete={onDelete}
      sortValue={sortValue}
      onSortChange={onSortChange}
      getItemName={(item) => item.name}
    />
  );
}
