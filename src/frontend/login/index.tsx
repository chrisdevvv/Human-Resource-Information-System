"use client";

import React, { useEffect } from "react";
import LoginPage from "./LoginPage";

export default function Login() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "DepEd Human Resource Information System";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return <LoginPage />;
}
