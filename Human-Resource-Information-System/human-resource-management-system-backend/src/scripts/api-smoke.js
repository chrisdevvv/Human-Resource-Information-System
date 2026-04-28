(async () => {
  try {
    const {
      TEST_ADMIN_PASSWORD,
      apiUrl,
      getFetch,
    } = require("./_scriptConfig");
    const fetch = await getFetch();

    const loginRes = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@deped.gov.ph",
        password: TEST_ADMIN_PASSWORD,
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

    const usersRes = await fetch(apiUrl("/api/users"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const usersJson = await usersRes.json();
    console.log("USERS_STATUS", usersRes.status);
    console.log("USERS_BODY", JSON.stringify(usersJson));

    const verifyRes = await fetch(apiUrl("/api/auth/verify-password"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: TEST_ADMIN_PASSWORD }),
    });
    const verifyJson = await verifyRes.json();
    console.log("VERIFY_STATUS", verifyRes.status);
    console.log("VERIFY_BODY", JSON.stringify(verifyJson));

    process.exit(0);
  } catch (err) {
    console.error("SMOKE_ERROR", err.message || err);
    process.exit(2);
  }
})();
