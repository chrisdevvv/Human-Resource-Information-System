(async () => {
  try {
    require("dotenv").config({
      path: require("path").join(__dirname, "../../.env"),
    });
    const fetch = globalThis.fetch || (await import("node-fetch")).default;

    console.log("1) Fetching frontend root /");
    let res = await fetch("http://localhost:3001/");
    console.log("/ ->", res.status);

    console.log("\n2) Login as Super Admin");
    res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@deped.gov.ph",
        password: "Admin@1234",
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
    res = await fetch("http://localhost:3000/api/registrations/pending", {
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
    res = await fetch("http://localhost:3001/leave-card/8");
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
