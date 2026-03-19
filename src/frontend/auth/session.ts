const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const LOGOUT_URL = `${API_BASE_URL}/api/auth/logout`;

export const clearClientSession = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  sessionStorage.clear();
};

export const notifyBackendLogoutOnClose = () => {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  fetch(LOGOUT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: "browser-close" }),
    keepalive: true,
  }).catch(() => {});
};

export const logoutNow = async () => {
  const token = localStorage.getItem("authToken");

  if (token) {
    try {
      await fetch(LOGOUT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore backend logout errors and still clear client session.
    }
  }

  clearClientSession();
};
