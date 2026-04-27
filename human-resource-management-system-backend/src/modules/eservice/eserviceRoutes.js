const express = require("express");
const {
  getAllEmployeePersonalInfo,
  getEmployeePersonalInfoById,
  getEmployeePersonalInfoCount,
  createEmployeePersonalInfo,
  updateEmployeePersonalInfo,
  deleteEmployeePersonalInfo,
  getDistricts,
  getSchools,
} = require("./eserviceController");

const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");

const router = express.Router();

// ==========================
// LOOKUP ROUTES
// ==========================
router.get(
  "/districts",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getDistricts,
);

router.get(
  "/schools",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getSchools,
);

// ==========================
// EMPLOYEE PERSONAL INFO CRUD
// ==========================
router.get(
  "/employees",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getAllEmployeePersonalInfo,
);

router.get(
  "/employees/count",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getEmployeePersonalInfoCount,
);

router.get(
  "/employees/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getEmployeePersonalInfoById,
);

router.post(
  "/employees",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  createEmployeePersonalInfo,
);

router.put(
  "/employees/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  updateEmployeePersonalInfo,
);

router.patch(
  "/employees/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  updateEmployeePersonalInfo,
);

router.delete(
  "/employees/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  deleteEmployeePersonalInfo,
);

module.exports = router;