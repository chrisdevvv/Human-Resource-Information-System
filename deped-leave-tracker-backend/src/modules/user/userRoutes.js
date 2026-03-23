const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  adminResetPassword,
  createDataEncoderByAdmin,
} = require("./userController");
const authMiddleware = require("../../middleware/authMiddleware");

const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");

const router = express.Router();

// User & Roles management - Admin and Super Admin only
router.post(
  "/admin-create",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  createDataEncoderByAdmin,
);
router.get(
  "/",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  getAllUsers,
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  getUserById,
);
router.patch(
  "/:id/role",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  updateUserRole,
);
router.patch(
  "/:id/status",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  updateUserStatus,
);
router.patch(
  "/:id/password",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  adminResetPassword,
);
router.delete(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  deleteUser,
);

module.exports = router;
