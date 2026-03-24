(async () => {
  try {
    const fetch = globalThis.fetch || (await import("node-fetch")).default;

    const adminPassword =
      process.env.TEST_ADMIN_PASSWORD ||
      process.env.ADMIN_PASSWORD ||
      "Admin@1234";
    const accounts = [
      {
        email: "superadmin@deped.gov.ph",
        password: adminPassword,
        name: "Super Admin",
      },
      {
        email: "testadmin@deped.gov.ph",
        password: adminPassword,
        name: "Test Admin",
      },
    ];

    for (const acc of accounts) {
      console.log("\n=== Account:", acc.name, acc.email, "===");
      const loginRes = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const loginJson = await loginRes.json();
      console.log("LOGIN_STATUS", loginRes.status);
      console.log("LOGIN_MESSAGE", loginJson.message || loginJson);
      if (!loginJson.token) {
        console.error("No token returned; skipping account.");
        continue;
      }
      const token = loginJson.token;

      // GET /api/users (admin-protected)
      const usersRes = await fetch("http://localhost:3000/api/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const usersJson = await usersRes.json();
      console.log(
        "GET /api/users",
        usersRes.status,
        usersJson.message ||
          (usersJson.data
            ? `${usersJson.data.length} items`
            : JSON.stringify(usersJson)),
      );

      // POST /api/auth/verify-password
      const verifyRes = await fetch(
        "http://localhost:3000/api/auth/verify-password",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: acc.password }),
        },
      );
      const verifyJson = await verifyRes.json();
      console.log(
        "POST /api/auth/verify-password",
        verifyRes.status,
        verifyJson.message || verifyJson,
      );
    }

    console.log("\nAll checks done.");
    process.exit(0);
  } catch (err) {
    console.error("ERROR", err.message || err);
    process.exit(2);
  }
})();
