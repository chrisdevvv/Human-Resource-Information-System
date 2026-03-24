(async () => {
  try {
    const fetch = globalThis.fetch || (await import("node-fetch")).default;
    const adminPassword =
      process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error(
        "Missing TEST_ADMIN_PASSWORD or ADMIN_PASSWORD in environment",
      );
      process.exit(1);
    }
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@deped.gov.ph",
        password: adminPassword,
      }),
    });
    const loginJson = await loginRes.json();
    console.log("LOGIN_STATUS", loginRes.status);
    console.log("LOGIN_BODY", JSON.stringify(loginJson));

    if (!loginJson.token) {
      console.error("No token returned; aborting.");
      process.exit(1);
    }

    const token = loginJson.token;

    const usersRes = await fetch("http://localhost:3000/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const usersJson = await usersRes.json();
    console.log("USERS_STATUS", usersRes.status);
    console.log("USERS_BODY", JSON.stringify(usersJson));

    const verifyRes = await fetch(
      "http://localhost:3000/api/auth/verify-password",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: adminPassword }),
      },
    );
    const verifyJson = await verifyRes.json();
    console.log("VERIFY_STATUS", verifyRes.status);
    console.log("VERIFY_BODY", JSON.stringify(verifyJson));

    process.exit(0);
  } catch (err) {
    console.error("SMOKE_ERROR", err.message || err);
    process.exit(2);
  }
})();
