const express = require("express");
const {
  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  getLeavesByEmployee,
  updateLeaveRequest,
  deleteLeaveRequest,
  creditMonthly,
  getLeaveParticulars,
  createLeaveParticular,
  updateLeaveParticular,
  deleteLeaveParticular,
} = require("./leaveController");
const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  idParamSchema,
  leaveBodySchema,
  leaveUpdateBodySchema,
  leaveParticularBodySchema,
  leaveParticularUpdateBodySchema,
  leaveParticularDeleteBodySchema,
} = require("../../validation/schemas");

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
  "/particulars",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getLeaveParticulars,
);
router.get(
  "/particulars/config",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  getLeaveParticulars,
);
router.post(
  "/particulars",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ body: leaveParticularBodySchema }),
  createLeaveParticular,
);
router.put(
  "/particulars",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ body: leaveParticularUpdateBodySchema }),
  updateLeaveParticular,
);
router.delete(
  "/particulars",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ body: leaveParticularDeleteBodySchema }),
  deleteLeaveParticular,
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  getLeaveRequestById,
);
router.post(
  "/",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ body: leaveBodySchema }),
  createLeaveRequest,
);
router.put(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: idParamSchema, body: leaveUpdateBodySchema }),
  updateLeaveRequest,
);

// Delete and Special operations - Admin and Super Admin only
router.delete(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  deleteLeaveRequest,
);
router.post(
  "/credit-monthly",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  creditMonthly,
);

module.exports = router;
