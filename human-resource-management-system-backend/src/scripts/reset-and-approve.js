(async () => {
  try {
    require("../config/loadEnv");
    const fetch = globalThis.fetch || (await import("node-fetch")).default;
    const adminPassword =
      process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    const encoderOldPassword = process.env.TEST_ENCODER_PASSWORD;
    const encoderNewPassword = process.env.TEST_ENCODER_NEW_PASSWORD;
    const regPassword = process.env.REG_PASSWORD;
    if (!adminPassword) {
      console.error(
        "Missing TEST_ADMIN_PASSWORD or ADMIN_PASSWORD in environment",
      );
      process.exit(1);
    }
    if (!encoderOldPassword) {
      console.error("Missing TEST_ENCODER_PASSWORD in environment");
      process.exit(1);
    }
    if (!encoderNewPassword) {
      console.error("Missing TEST_ENCODER_NEW_PASSWORD in environment");
      process.exit(1);
    }
    if (!regPassword) {
      console.error("Missing REG_PASSWORD in environment");
      process.exit(1);
    }
    const jwt = require("jsonwebtoken");
    const pool = require("../config/db");
    const bcrypt = require("bcryptjs");

    // 1) Password reset for testencoder
    const targetEmail = "testencoder@deped.gov.ph";
    const [rows] = await pool
      .promise()
      .query("SELECT id, password_hash FROM users WHERE email = ? LIMIT 1", [
        targetEmail,
      ]);
    if (rows.length === 0) throw new Error("User not found: " + targetEmail);
    const user = rows[0];
    console.log("Found user", user.id);

    const secret = process.env.JWT_SECRET || "dev_jwt_secret";
    const resetToken = jwt.sign(
      { id: user.id, purpose: "password-reset" },
      secret + user.password_hash,
      { expiresIn: "2h" },
    );
    console.log("Generated reset token");
    try {
      const decodedLocal = jwt.verify(resetToken, secret + user.password_hash);
      console.log("Local verify OK", decodedLocal);
    } catch (err) {
      console.error("Local verify failed", err.message);
    }

    // Verify-old-password
    let res = await fetch(
      "http://localhost:3000/api/auth/verify-old-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          password: encoderOldPassword,
        }),
      },
    );
    console.log("verify-old-password", res.status, await res.json());

    // Reset-password to a new one
    const newPass = encoderNewPassword;
    res = await fetch("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, newPassword: newPass }),
    });
    console.log("reset-password", res.status, await res.json());

    // Try login with new password
    res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, password: newPass }),
    });
    const loginJson = await res.json();
    console.log(
      "login with new pass",
      res.status,
      loginJson.message || loginJson,
    );
    if (!loginJson.token) throw new Error("Login with new password failed");

    // Revert password using superadmin adminResetPassword
    const adminLogin = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@deped.gov.ph",
        password: adminPassword,
      }),
    });
    const adminJson = await adminLogin.json();
    const adminToken = adminJson.token;
    res = await fetch(`http://localhost:3000/api/users/${user.id}/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        new_password: encoderOldPassword,
        admin_password: adminPassword,
      }),
    });
    console.log("admin reset back", res.status, await res.json());

    // 2) Registration flow: create registration request
    const regEmail = `tmp-reg-${Date.now()}@example.test`;
    res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: "Reg",
        last_name: "User",
        email: regEmail,
        password: regPassword,
        school_name: "Reg School",
      }),
    });
    console.log("register request", res.status, await res.json());

    // Get pending registrations as admin
    res = await fetch("http://localhost:3000/api/registrations/pending", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });
    const pending = await res.json();
    console.log("pending count", pending.data ? pending.data.length : pending);
    const found = (pending.data || []).find((r) => r.email === regEmail);
    if (!found)
      throw new Error("Registration request not found in pending list");
    console.log("found pending id", found.id);

    // Approve the registration
    res = await fetch(
      `http://localhost:3000/api/registrations/${found.id}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approved_role: "DATA_ENCODER",
          temporary_password: regPassword,
        }),
      },
    );
    console.log("approve", res.status, await res.json());

    // Try login as new account
    res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail, password: regPassword }),
    });
    console.log("login new reg", res.status, await res.json());

    console.log("ALL DONE");
    process.exit(0);
  } catch (err) {
    console.error("ERROR", err.message || err);
    process.exit(2);
  }
})();
