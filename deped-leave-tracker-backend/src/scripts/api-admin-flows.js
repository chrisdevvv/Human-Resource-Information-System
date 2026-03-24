(async () => {
  try {
    const fetch = globalThis.fetch || (await import("node-fetch")).default;
    // 1. Login as superadmin
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@deped.gov.ph",
        password: "Admin@1234",
      }),
    });
    const loginJson = await loginRes.json();
    console.log(
      "LOGIN",
      loginRes.status,
      JSON.stringify(loginJson.message || loginJson),
    );
    if (!loginJson.token) throw new Error("Login failed, no token");
    const token = loginJson.token;

    // 2. Get all users and resolve IDs for test accounts
    const allRes = await fetch("http://localhost:3000/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const allJson = await allRes.json();
    console.log(
      "GET_USERS",
      allRes.status,
      allJson.data ? `${allJson.data.length} users` : JSON.stringify(allJson),
    );

    const findByEmail = (email) =>
      (allJson.data || []).find((u) => u.email === email);
    const admin = findByEmail("testadmin@deped.gov.ph");
    const encoder = findByEmail("testencoder@deped.gov.ph");

    if (!admin || !encoder) {
      console.error("Could not find test users in users list.");
      process.exit(2);
    }

    // 3. Fetch details for both users
    for (const u of [admin, encoder]) {
      const r = await fetch(`http://localhost:3000/api/users/${u.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const j = await r.json();
      console.log(
        `USER_${u.id}_DETAILS`,
        r.status,
        JSON.stringify(j.data || j),
      );
    }

    // 4. Promote encoder -> ADMIN, then demote back to DATA_ENCODER
    console.log("PROMOTE encoder -> ADMIN");
    const promoteRes = await fetch(
      `http://localhost:3000/api/users/${encoder.id}/role`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "ADMIN" }),
      },
    );
    console.log(
      "PROMOTE",
      promoteRes.status,
      JSON.stringify(await promoteRes.json()),
    );

    console.log("DEMOTE encoder -> DATA_ENCODER");
    const demoteRes = await fetch(
      `http://localhost:3000/api/users/${encoder.id}/role`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "DATA_ENCODER" }),
      },
    );
    console.log(
      "DEMOTE",
      demoteRes.status,
      JSON.stringify(await demoteRes.json()),
    );

    // 5. Deactivate and reactivate the test admin
    console.log("DEACTIVATE test admin");
    const deactivateRes = await fetch(
      `http://localhost:3000/api/users/${admin.id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: false }),
      },
    );
    console.log(
      "DEACTIVATE",
      deactivateRes.status,
      JSON.stringify(await deactivateRes.json()),
    );

    console.log("REACTIVATE test admin");
    const reactivateRes = await fetch(
      `http://localhost:3000/api/users/${admin.id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: true }),
      },
    );
    console.log(
      "REACTIVATE",
      reactivateRes.status,
      JSON.stringify(await reactivateRes.json()),
    );

    // 6. Create a temporary data encoder via admin-create
    const tmpEmail = `tmp-encoder-${Date.now()}@example.test`;
    console.log("CREATE temp encoder:", tmpEmail);
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
      const tmpId = createJson.data.id;
      // 7. Delete the temporary user
      console.log("DELETE temp encoder id:", tmpId);
      const delRes = await fetch(`http://localhost:3000/api/users/${tmpId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("DELETE", delRes.status, JSON.stringify(await delRes.json()));
    }

    console.log("ADMIN FLOWS COMPLETE");
    process.exit(0);
  } catch (err) {
    console.error("ERROR", err.message || err);
    process.exit(2);
  }
})();
