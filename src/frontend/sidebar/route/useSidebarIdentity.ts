"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isSuperAdminRole,
  normalizeSidebarRole,
  type SidebarRole,
} from "./sidebarConfig";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

function safeValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getFirstNameFromStoredUser(userStr: string | null): string {
  if (!userStr) {
    return "";
  }

  try {
    const parsed = JSON.parse(userStr) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return "";
    }

    const root = parsed as Record<string, unknown>;
    const nestedCandidates = [root, root.user, root.data, root.profile].filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    );

    for (const candidate of nestedCandidates) {
      const fullName =
        safeValue(candidate.fullName) ||
        safeValue(candidate.full_name) ||
        safeValue(candidate.name);
      const firstName =
        safeValue(candidate.firstName) || safeValue(candidate.first_name);
      const lastName =
        safeValue(candidate.lastName) || safeValue(candidate.last_name);
      const email = safeValue(candidate.email);

      const combinedName = [firstName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const nameSource = fullName || combinedName || firstName;

      if (nameSource) {
        return nameSource.split(/\s+/)[0];
      }

      if (email.includes("@")) {
        const emailName = email
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .trim();

        if (emailName) {
          return emailName.split(/\s+/)[0];
        }
      }
    }
  } catch {
    return "";
  }

  return "";
}

function toPositiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function getSchoolContextFromStoredUser(userStr: string | null): {
  schoolName: string;
  schoolId: number | null;
} {
  if (!userStr) {
    return { schoolName: "", schoolId: null };
  }

  try {
    const parsed = JSON.parse(userStr) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { schoolName: "", schoolId: null };
    }

    const root = parsed as Record<string, unknown>;
    const nestedCandidates = [root, root.user, root.data, root.profile].filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    );

    let fallbackSchoolId: number | null = null;

    for (const candidate of nestedCandidates) {
      const directSchoolName =
        safeValue(candidate.school_name) || safeValue(candidate.schoolName);
      const directSchoolId = toPositiveNumber(
        candidate.school_id ?? candidate.schoolId,
      );

      const schoolObj =
        typeof candidate.school === "object" && candidate.school !== null
          ? (candidate.school as Record<string, unknown>)
          : null;

      const nestedSchoolName = schoolObj
        ? safeValue(schoolObj.school_name) ||
          safeValue(schoolObj.schoolName) ||
          safeValue(schoolObj.name)
        : "";

      const nestedSchoolId = schoolObj
        ? toPositiveNumber(schoolObj.id ?? schoolObj.school_id)
        : null;

      const resolvedSchoolName =
        directSchoolName || nestedSchoolName || safeValue(candidate.school);
      const resolvedSchoolId = directSchoolId ?? nestedSchoolId;

      if (!fallbackSchoolId && resolvedSchoolId) {
        fallbackSchoolId = resolvedSchoolId;
      }

      if (resolvedSchoolName) {
        return {
          schoolName: resolvedSchoolName,
          schoolId: resolvedSchoolId ?? fallbackSchoolId,
        };
      }
    }

    return { schoolName: "", schoolId: fallbackSchoolId };
  } catch {
    return { schoolName: "", schoolId: null };
  }
}

type SidebarIdentity = {
  firstName: string;
  schoolLabel: string;
  normalizedRole: SidebarRole;
};

export function useSidebarIdentity(role: string): SidebarIdentity {
  const [firstName, setFirstName] = useState("");
  const [schoolLabel, setSchoolLabel] = useState("");
  const normalizedRole = useMemo(() => normalizeSidebarRole(role), [role]);

  useEffect(() => {
    let isDisposed = false;

    const loadSchoolLabel = async () => {
      try {
        const userStr = localStorage.getItem("user");
        setFirstName(getFirstNameFromStoredUser(userStr));

        if (isSuperAdminRole(role)) {
          setSchoolLabel("Department of Education");
          return;
        }

        const { schoolName, schoolId } = getSchoolContextFromStoredUser(userStr);

        if (schoolName) {
          setSchoolLabel(schoolName);
          return;
        }

        setSchoolLabel("Assigned School");

        if (!schoolId) {
          return;
        }

        const token = localStorage.getItem("authToken");
        if (!token) {
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/schools/${schoolId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const body = (await response.json().catch(() => ({}))) as {
          data?: { school_name?: unknown };
        };

        if (!response.ok || isDisposed) {
          return;
        }

        const fetchedSchoolName = safeValue(body.data?.school_name);
        if (fetchedSchoolName) {
          setSchoolLabel(fetchedSchoolName);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setSchoolLabel(
          isSuperAdminRole(role)
            ? "Department of Education"
            : "Assigned School",
        );
      }
    };

    loadSchoolLabel();

    return () => {
      isDisposed = true;
    };
  }, [role]);

  return {
    firstName,
    schoolLabel,
    normalizedRole,
  };
}
