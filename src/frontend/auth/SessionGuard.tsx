"use client";

import { useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOGOUT_BROADCAST_KEY } from "./session";

const SESSION_FLAG_KEY = "authSessionActive";
const PROTECTED_ROUTE_PREFIXES = [
  "/admin",
  "/super-admin",
  "/data-encoder",
  "/leave-card",
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasActiveClientSession(): boolean {
  const token = localStorage.getItem("authToken");
  const user = localStorage.getItem("user");
  const isActiveSession = sessionStorage.getItem(SESSION_FLAG_KEY) === "1";
  return Boolean(token && user && isActiveSession);
}

export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useLayoutEffect(() => {
    const verifyAccess = () => {
      const active = hasActiveClientSession();

      if (!active) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        sessionStorage.clear();

        if (isProtectedRoute(pathname)) {
          router.replace("/login");
        }
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === LOGOUT_BROADCAST_KEY ||
        event.key === "authToken" ||
        event.key === "user"
      ) {
        verifyAccess();
      }
    };

    verifyAccess();
    window.addEventListener("pageshow", verifyAccess);
    window.addEventListener("popstate", verifyAccess);
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", verifyAccess);

    return () => {
      window.removeEventListener("pageshow", verifyAccess);
      window.removeEventListener("popstate", verifyAccess);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", verifyAccess);
    };
  }, [pathname, router]);

  return null;
}
