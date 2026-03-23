const express = require("express");
const {
  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  getLeavesByEmployee,
  updateLeaveRequest,
  deleteLeaveRequest,
  creditMonthly,
} = require("./leaveController");
const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");

const router = express.Router();

// Leave Management - All authenticated users can read/create/update
router.get(
  "/",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getAllLeaveRequests,
);
router.get(
  "/employee/:employee_id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getLeavesByEmployee,
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getLeaveRequestById,
);
router.post(
  "/",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  createLeaveRequest,
);
router.put(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  updateLeaveRequest,
);

// Delete and Special operations - Admin and Super Admin only
router.delete(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  deleteLeaveRequest,
);
router.post(
  "/credit-monthly",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  creditMonthly,
);

module.exports = router;
