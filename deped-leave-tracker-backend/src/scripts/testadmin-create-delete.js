(async () => {
  try {
    const fetch = globalThis.fetch || (await import("node-fetch")).default;
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "testadmin@deped.gov.ph",
        password: "Admin@1234",
      }),
    });
    const loginJson = await loginRes.json();
    console.log("LOGIN", loginRes.status, loginJson.message || loginJson);
    if (!loginJson.token) throw new Error("Login failed");
    const token = loginJson.token;

    const tmpEmail = `tmp-created-${Date.now()}@example.test`;
    const createRes = await fetch(
      "http://localhost:3000/api/users/admin-create",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: "Tmp",
          last_name: "Encoder",
          email: tmpEmail,
          password: "TmpPass@123",
          school_name: "Tmp School",
        }),
      },
    );
    const createJson = await createRes.json();
    console.log("CREATE", createRes.status, JSON.stringify(createJson));

    if (createJson.data && createJson.data.id) {
      const id = createJson.data.id;
      const delRes = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("DELETE", delRes.status, JSON.stringify(await delRes.json()));
    } else {
      console.log("No id returned, skipping delete.");
    }

    console.log("DONE");
    process.exit(0);
  } catch (err) {
    console.error("ERROR", err.message || err);
    process.exit(2);
  }
})();
