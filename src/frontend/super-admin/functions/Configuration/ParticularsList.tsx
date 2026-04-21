"use client";

import { useEffect, useState } from "react";
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
      title="Particulars"
      description="Manage particulars used in leave dropdown fields."
      searchPlaceholder="Search particulars..."
      addLabel="Add Particular"
      icon={ListChecks}
      items={items}
      searchValue={localSearchValue}
      onSearchChange={setLocalSearchValue}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      onAdd={onAdd}
      onDelete={onDelete}
      sortValue={sortValue}
      onSortChange={onSortChange}
      getItemName={(item) => item.name}
    />
  );
}