"use client";

import { useLayoutEffect } from "react";

const SESSION_FLAG_KEY = "authSessionActive";

export default function SessionGuard() {
  useLayoutEffect(() => {
    const isActiveSession = sessionStorage.getItem(SESSION_FLAG_KEY) === "1";

    // If this is a fresh tab/window with no active session flag, clear persisted auth.
    if (!isActiveSession) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.clear();
    }
  }, []);

  return null;
}
