// Role-based authorization middleware
// Allows certain routes to be accessed only by specified roles

const roleAuthMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (authMiddleware must run first)
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Normalize the user's role
      const userRole = normalizeRole(req.user.role);

      // Check if user's role is allowed
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message:
            "Forbidden: You do not have permission to access this resource",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Normalize role to standard format
function normalizeRole(role) {
  if (!role || typeof role !== "string") return "data-encoder";

  const value = role.trim().toLowerCase();

  if (
    value === "data_encoder" ||
    value === "data-encoder" ||
    value === "data encoder"
  ) {
    return "data-encoder";
  }

  if (
    value === "super_admin" ||
    value === "super-admin" ||
    value === "super admin"
  ) {
    return "super-admin";
  }

  if (value === "admin" || value === "admin_user") {
    return "admin";
  }

  return "data-encoder";
}

module.exports = { roleAuthMiddleware, normalizeRole };
