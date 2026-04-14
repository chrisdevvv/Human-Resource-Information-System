const fs = require("fs");
const path = require("path");

function loadEnv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line
      .slice(eq + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    process.env[key] = val;
  }
}

(async () => {
  try {
    loadEnv(path.resolve(process.cwd(), ".env"));

    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const adminPassword =
      process.env.TEST_ADMIN_PASSWORD ||
      process.env.ADMIN_PASSWORD ||
      "Admin@1234";

    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@deped.gov.ph",
        password: adminPassword,
      }),
    });
    const loginJson = await loginRes.json().catch(() => ({}));

    if (!loginRes.ok || !loginJson.token) {
      console.log(
        JSON.stringify(
          { step: "login", status: loginRes.status, body: loginJson },
          null,
          2,
        ),
      );
      process.exit(3);
    }

    const token = loginJson.token;

    const schoolsRes = await fetch(`${base}/api/schools/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const schoolsJson = await schoolsRes.json().catch(() => ({}));

    const school =
      Array.isArray(schoolsJson.data) && schoolsJson.data.length
        ? schoolsJson.data[0]
        : null;
    if (!school) {
      console.log(
        JSON.stringify(
          { step: "schools", status: schoolsRes.status, body: schoolsJson },
          null,
          2,
        ),
      );
      process.exit(4);
    }

    const civilRes = await fetch(`${base}/api/civil-statuses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const civilJson = await civilRes.json().catch(() => ({}));
    const civil =
      Array.isArray(civilJson.data) && civilJson.data.length
        ? civilJson.data[0]
        : null;

    const sexRes = await fetch(`${base}/api/sexes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sexJson = await sexRes.json().catch(() => ({}));
    const sex =
      Array.isArray(sexJson.data) && sexJson.data.length
        ? sexJson.data[0]
        : null;

    const posRes = await fetch(`${base}/api/positions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const posJson = await posRes.json().catch(() => ({}));
    const pos =
      Array.isArray(posJson.data) && posJson.data.length
        ? posJson.data[0]
        : null;

    const districtRes = await fetch(`${base}/api/districts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const districtJson = await districtRes.json().catch(() => ({}));
    const district =
      Array.isArray(districtJson.data) && districtJson.data.length
        ? districtJson.data[0]
        : null;

    const stamp = Date.now().toString().slice(-7);
    const payload = {
      first_name: "Debug",
      middle_name: "Trace",
      no_middle_name: false,
      last_name: "Employee",
      middle_initial: "T",
      personal_email: `debug${stamp}@mail.test`,
      email: `debug${stamp}@mail.test`,
      mobile_number: `09${stamp.padStart(9, "0")}`.slice(0, 11),
      home_address: "Debug Address",
      place_of_birth: "Debug City",
      civil_status: civil?.civil_status_name || "Single",
      civil_status_id: civil?.id || null,
      sex: sex?.sex_name || "M",
      sex_id: sex?.id || null,
      employee_type: "non-teaching",
      school_id: school.id,
      employee_no: stamp,
      work_email: `debug${stamp}@deped.gov.ph`,
      district: district?.district_name || "District 1",
      position: pos?.position_name || "Teacher I",
      position_id: pos?.id || null,
      plantilla_no: `PL-${stamp}`,
      age: 30,
      birthdate: "1996-01-01",
      prc_license_no: `PRC-${stamp}`,
      tin: `123-456-${stamp.slice(-3)}`,
      gsis_bp_no: "12345-123456",
      gsis_crn_no: `1234-567-${stamp.slice(-4)}`,
      pagibig_no: `1234-567-${stamp.slice(-4)}`,
      philhealth_no: `12${stamp.padStart(10, "0")}`.slice(0, 12),
    };

    const createRes = await fetch(`${base}/api/employees/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const createBody = await createRes.json().catch(() => ({}));
    console.log(
      JSON.stringify(
        {
          step: "create",
          status: createRes.status,
          message: createBody.message,
          error: createBody.error,
          body: createBody,
        },
        null,
        2,
      ),
    );

    process.exit(0);
  } catch (err) {
    console.log(
      JSON.stringify(
        { step: "exception", error: err?.message || String(err) },
        null,
        2,
      ),
    );
    process.exit(1);
  }
})();
