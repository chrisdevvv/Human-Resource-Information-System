"use client";

import { useEffect, useState } from "react";
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
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);

  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localSearchValue !== searchValue) {
        onSearchChange(localSearchValue);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [localSearchValue, searchValue, onSearchChange]);

  const handleClearFilters = () => {
    setLocalSearchValue("");
    onClearFilters();
  };

  return (
    <ListLayout
      title="Schools"
      description="Manage school options shown in dropdown fields."
      searchPlaceholder="Search schools..."
      addLabel="Add School"
      icon={Building2}
      items={items}
      searchValue={localSearchValue}
      onSearchChange={setLocalSearchValue}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      onAdd={onAdd}
      onDelete={onDelete}
      sortValue={sortValue}
      onSortChange={onSortChange}
      getItemName={(item) => item.school_name}
    />
  );
}