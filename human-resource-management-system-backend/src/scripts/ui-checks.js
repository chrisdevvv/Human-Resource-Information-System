(async () => {
  try {
    require("../config/loadEnv");
    const fetch = globalThis.fetch || (await import("node-fetch")).default;

    const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;
    const API_BASE_URL = process.env.API_BASE_URL;
    const adminPassword =
      process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!FRONTEND_BASE_URL || !API_BASE_URL) {
      console.error(
        "Missing env: FRONTEND_BASE_URL and/or API_BASE_URL. Please set them in .env",
      );
      process.exit(2);
    }

    if (!adminPassword) {
      console.error(
        "Missing env: TEST_ADMIN_PASSWORD or ADMIN_PASSWORD required for UI checks",
      );
      process.exit(2);
    }

    console.log("1) Fetching frontend root /");
    let res = await fetch(`${FRONTEND_BASE_URL}/`);
    console.log("/ ->", res.status);

    console.log("\n2) Login as Super Admin");
    res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@deped.gov.ph",
        password: adminPassword,
      }),
    });
    const login = await res.json();
    console.log(
      "login ->",
      res.status,
      login.message || "token=" + (login.token ? "present" : "missing"),
    );
    if (!login.token) throw new Error("Login failed");
    const token = login.token;

    console.log(
      "\n3) Fetch pending registrations page (UI uses /api/registrations/pending)",
    );
    res = await fetch(`${API_BASE_URL}/api/registrations/pending`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const pending = await res.json();
    console.log(
      "pending ->",
      res.status,
      pending.data ? `${pending.data.length} items` : JSON.stringify(pending),
    );

    console.log(
      "\n4) Load printable leave card for employee id 8 (server-rendered page)",
    );
    res = await fetch(`${FRONTEND_BASE_URL}/leave-card/8`);
    const html = await res.text();
    console.log("/leave-card/8 ->", res.status);

    const foundName = /Super\s+Admin|Test\s+Admin|Test\s+Encoder/.test(html);
    console.log("Printable page contains expected names?", foundName);

    console.log("\nUI checks complete.");
    process.exit(0);
  } catch (err) {
    console.error("UI_CHECK_ERROR", err.message || err);
    process.exit(2);
  }
})();
