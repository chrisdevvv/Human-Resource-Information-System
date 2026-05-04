const express = require("express");
const {
  getAllEmployeePersonalInfo,
  getEmployeePersonalInfoById,
  getEmployeePersonalInfoCount,
  getRetirementCounts,
  createEmployeePersonalInfo,
  updateEmployeePersonalInfo,
  deleteEmployeePersonalInfo,
  getDistricts,
  getSchools,
  sendServiceRecord,
} = require("./eserviceController");

const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");

const router = express.Router();

// ==========================
// SERVICE RECORD ROUTE
// ==========================
router.post("/service-records/send", sendServiceRecord);

// ==========================
// LOOKUP ROUTES
// ==========================
router.get(
  "/districts",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  getDistricts,
);

router.get(
  "/schools",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  getSchools,
);

// ==========================
// EMPLOYEE PERSONAL INFO CRUD
// ==========================
router.get(
  "/employees",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  getAllEmployeePersonalInfo,
);

router.get(
  "/employees/count",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  getEmployeePersonalInfoCount,
);

router.get(
  "/employees/retirement-counts",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  getRetirementCounts,
);

router.get(
  "/employees/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  getEmployeePersonalInfoById,
);

router.post(
  "/employees",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  createEmployeePersonalInfo,
);

router.put(
  "/employees/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  updateEmployeePersonalInfo,
);

router.patch(
  "/employees/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  updateEmployeePersonalInfo,
);

router.delete(
  "/employees/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  deleteEmployeePersonalInfo,
);

module.exports = router;