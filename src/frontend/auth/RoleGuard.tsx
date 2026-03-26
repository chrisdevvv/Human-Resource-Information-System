// Role-based Access Guard Component
// Prevents unauthorized users from accessing protected pages

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { canAccessPage } from "./roleAccess";

interface RoleGuardProps {
  requiredRoles?: string[];
  pageId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGuard component - wraps pages that require specific roles
 * Redirects to dashboard or login if user doesn't have access
 */
export function RoleGuard({
  pageId,
  children,
  fallback = null,
}: RoleGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        // No user logged in, redirect to login
        router.push("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const userRole = user?.role || "";

      // Check if user has access to this page
      if (!canAccessPage(userRole, pageId)) {
        // User doesn't have permission, redirect to dashboard
        console.warn(
          `Access denied: User role "${userRole}" cannot access page "${pageId}"`,
        );

        // Redirect to appropriate dashboard based on role
        if (userRole.toLowerCase().includes("super")) {
          router.push("/super-admin");
        } else if (userRole.toLowerCase().includes("admin")) {
          router.push("/admin");
        } else {
          router.push("/data-encoder");
        }
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Error in RoleGuard:", error);
      router.push("/login");
    } finally {
      setIsChecking(false);
    }
  }, [pageId, router]);

  // Show loading or fallback while checking authorization
  if (isChecking) {
    return fallback || <div className="p-4">Loading...</div>;
  }

  // Show fallback if not authorized
  if (!isAuthorized) {
    return fallback || <div className="p-4">Access Denied</div>;
  }

  // User is authorized, render children
  return <>{children}</>;
}

export default RoleGuard;
