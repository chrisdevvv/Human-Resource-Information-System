"use client";

import React, { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import LoginPageMobile from "./LoginPageMobile";

export default function Login() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "DepEd Human Resource Information System";

    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const updateView = () => {
      setIsMobile(mediaQuery.matches);
      setMounted(true);
    };

    updateView();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateView);
      return () => {
        mediaQuery.removeEventListener("change", updateView);
        document.title = previousTitle;
      };
    }

    mediaQuery.addListener(updateView);
    return () => {
      mediaQuery.removeListener(updateView);
      document.title = previousTitle;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return isMobile ? <LoginPageMobile /> : <LoginPage />;
}
