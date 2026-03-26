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
const { validateRequest } = require("../../middleware/validateRequest");
const {
  idParamSchema,
  userRoleBodySchema,
  userStatusBodySchema,
  userPasswordResetBodySchema,
  userAdminCreateBodySchema,
  usersQuerySchema,
} = require("../../validation/schemas");

const router = express.Router();

// User & Roles management - Admin and Super Admin only
router.post(
  "/admin-create",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ body: userAdminCreateBodySchema }),
  createDataEncoderByAdmin,
);
router.get(
  "/",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ query: usersQuerySchema }),
  getAllUsers,
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  getUserById,
);
router.patch(
  "/:id/role",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema, body: userRoleBodySchema }),
  updateUserRole,
);
router.patch(
  "/:id/status",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema, body: userStatusBodySchema }),
  updateUserStatus,
);
router.patch(
  "/:id/password",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema, body: userPasswordResetBodySchema }),
  adminResetPassword,
);
router.delete(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  deleteUser,
);

module.exports = router;
