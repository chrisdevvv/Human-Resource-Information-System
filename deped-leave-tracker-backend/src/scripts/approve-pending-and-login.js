(async () => {
  try {
    require("dotenv").config({
      path: require("path").join(__dirname, "../../.env"),
    });
    const fetch = globalThis.fetch || (await import("node-fetch")).default;

    // Login as Super Admin
    let res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@deped.gov.ph",
        password: "Admin@1234",
      }),
    });
    const admin = await res.json();
    if (!admin.token) throw new Error("Admin login failed");
    const adminToken = admin.token;
    console.log("Admin login OK");

    // Get pending registrations
    res = await fetch("http://localhost:3000/api/registrations/pending", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });
    const pending = await res.json();
    const pendingList = pending.data || [];
    if (pendingList.length === 0) {
      console.log("No pending registrations found");
      process.exit(0);
    }

    const target = pendingList[0];
    console.log("Approving registration id", target.id, "email", target.email);

    // Approve as admin (admins can only create DATA_ENCODER)
    res = await fetch(
      `http://localhost:3000/api/registrations/${target.id}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approved_role: "DATA_ENCODER",
          temporary_password: "TempPass@123",
        }),
      },
    );
    const approveJson = await res.json();
    console.log(
      "Approve result",
      res.status,
      approveJson.message || approveJson,
    );

    // Try login as the newly approved user
    res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: target.email, password: "TempPass@123" }),
    });
    const loginJson = await res.json();
    console.log(
      "Login new user",
      res.status,
      loginJson.message ||
        (loginJson.token ? "token present" : JSON.stringify(loginJson)),
    );

    process.exit(0);
  } catch (err) {
    console.error("ERROR", err.message || err);
    process.exit(2);
  }
})();
