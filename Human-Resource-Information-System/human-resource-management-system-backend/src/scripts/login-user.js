(async () => {
  try {
    const { apiUrl, getFetch } = require("./_scriptConfig");
    const fetch = await getFetch();
    const email = process.argv[2];
    const password = process.argv[3];
    if (!email || !password) {
      console.error("Usage: node login-user.js <email> <password>");
      process.exit(1);
    }

    const res = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    console.log("Status", res.status);
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("ERROR", err.message || err);
    process.exit(2);
  }
})();
