"use client";
import React, { useEffect } from "react";
import Login from "../../frontend/login";
import { setLoginTitle } from "../../frontend/utils/pageTitle";

export default function Page() {
  useEffect(() => {
    setLoginTitle();
  }, []);

  return <Login />;
}
