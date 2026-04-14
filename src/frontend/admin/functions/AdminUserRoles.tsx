"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpAZ,
  ArrowDownAZ,
  Settings,
  UserPlus,
  UserCheck,
  X,
  Eye,
  Search,
} from "lucide-react";
import AdminPendingAccounts from "./AdminPendingAccounts";
import AdminAddUserModal from "./AdminAddUserModal";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  isActive: boolean;
};

type EditableUserRole = "ADMIN" | "DATA_ENCODER";
type EditableUser = Omit<User, "role"> & { role: EditableUserRole };

type UserApiRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school_name?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";
  is_active: unknown;
};

import UserRoles from "../../super-admin/functions/UserRoles/UserRoles";

export default function AdminUserRoles() {
  return <UserRoles mode="admin" />;
}
const USER_ROLES_TAB_KEY = "userRoles:activeTab";
