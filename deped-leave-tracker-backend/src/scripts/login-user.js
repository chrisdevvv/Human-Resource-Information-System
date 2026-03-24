(async () => {
  try {
    require("dotenv").config({
      path: require("path").join(__dirname, "../../.env"),
    });
    const fetch = globalThis.fetch || (await import("node-fetch")).default;
    const email = process.argv[2];
    const password = process.argv[3];
    if (!email || !password) {
      console.error("Usage: node login-user.js <email> <password>");
      process.exit(1);
    }

    const res = await fetch("http://localhost:3000/api/auth/login", {
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
