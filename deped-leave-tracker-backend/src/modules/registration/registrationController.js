const Registration = require("./registrationModel");
const Backlog = require("../backlog/backlogModel");
const {
  sendRegistrationApproved,
  sendRegistrationRejected,
  sendAccountCreatedCredentials,
} = require("../../utils/mailer");

const scopedRoles = new Set(["ADMIN", "DATA_ENCODER"]);
const normalizeRole = (role) => String(role || "").trim().toUpperCase();

const resolveScope = async (user) => {
  const role = normalizeRole(user?.role);
  if (role === "SUPER_ADMIN") {
    return { role, schoolName: null };
  }

  if (!scopedRoles.has(role)) {
    const err = new Error("Only admin, data encoder, or super admin can review registrations");
    err.statusCode = 403;
    throw err;
  }

  if (!user?.school_id) {
    const err = new Error("Your account has no assigned school");
    err.statusCode = 403;
    throw err;
  }

  const schoolName = await Registration.getSchoolNameById(user.school_id);
  if (!schoolName) {
    const err = new Error("Assigned school not found");
    err.statusCode = 403;
    throw err;
  }

  return { role, schoolName };
};

const getAllRegistrations = async (req, res) => {
  try {
    const { status } = req.query;
    const scope = await resolveScope(req.user);
    const results = await Registration.getAll(status || null, {
      schoolName: scope.schoolName,
    });
    res.status(200).json({ data: results });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: "Error retrieving registration requests",
      error: err.message,
    });
  }
};

const getPendingRegistrations = async (req, res) => {
  try {
    const scope = await resolveScope(req.user);
    const results = await Registration.getAll("PENDING", {
      schoolName: scope.schoolName,
    });
    res.status(200).json({ data: results });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: "Error retrieving pending registrations",
      error: err.message,
    });
  }
};

const getRegistrationById = async (req, res) => {
  try {
    const scope = await resolveScope(req.user);
    const result = await Registration.getById(req.params.id, {
      schoolName: scope.schoolName,
    });
    if (!result)
      return res
        .status(404)
        .json({ message: "Registration request not found" });
    res.status(200).json({ data: result });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: "Error retrieving registration request",
      error: err.message,
    });
  }
};

const approveRegistration = async (req, res) => {
  try {
    const scope = await resolveScope(req.user);

    // Fetch record before approving so we have email/name for the notification
    const registration = await Registration.getById(req.params.id, {
      schoolName: scope.schoolName,
    });
    if (!registration) {
      return res
        .status(404)
        .json({ message: "Registration request not found" });
    }

    const { approved_role, temporary_password, suppress_approved_email } =
      req.body;

    // Admin approvals are intentionally locked to DATA_ENCODER only.
    const isScopedApprover = scopedRoles.has(scope.role);
    const finalRole = isScopedApprover
      ? "DATA_ENCODER"
      : approved_role || registration.requested_role || "DATA_ENCODER";

    if (
      isScopedApprover &&
      approved_role &&
      approved_role !== "DATA_ENCODER"
    ) {
      return res
        .status(403)
        .json({ message: "Admin/Data Encoder can only approve Data Encoder accounts" });
    }

    await Registration.approve(
      req.params.id,
      finalRole,
      req.user.id,
      temporary_password,
    );

    // Fire-and-forget — email failure must not block the response
    const shouldSuppressApprovedEmail =
      suppress_approved_email === true || suppress_approved_email === "true";

    if (temporary_password) {
      sendAccountCreatedCredentials(
        registration.email,
        registration.first_name,
        finalRole,
        registration.email,
        String(temporary_password),
      );
    } else if (!shouldSuppressApprovedEmail) {
      sendRegistrationApproved(
        registration.email,
        registration.first_name,
        finalRole,
      );
    }
    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: "REGISTRATION_APPROVED",
      details: `${registration.first_name} ${registration.last_name} as ${finalRole}`,
    });

    res
      .status(200)
      .json({ message: "Registration request approved successfully" });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes("not found") ? 404 : 500);
    res.status(statusCode).json({
      message: "Error approving registration",
      error: err.message,
    });
  }
};

const rejectRegistration = async (req, res) => {
  try {
    const scope = await resolveScope(req.user);
    // Fetch record before rejecting so we have email/name for the notification.
    // For admin/data-encoder, school scope is enforced by the query filter.
    const registration = await Registration.getById(req.params.id, {
      schoolName: scope.schoolName,
    });
    if (!registration) {
      return res
        .status(404)
        .json({ message: "Registration request not found" });
    }

    const { rejection_reason } = req.body;
    await Registration.reject(
      req.params.id,
      rejection_reason || null,
      req.user.id,
    );

    // Fire-and-forget — email failure must not block the response
    sendRegistrationRejected(
      registration.email,
      registration.first_name,
      rejection_reason || null,
    );
    await Backlog.record({
      user_id: req.user.id,
      school_id: null,
      employee_id: null,
      leave_id: null,
      action: "REGISTRATION_REJECTED",
      details: `${registration.first_name} ${registration.last_name}${rejection_reason ? `: ${rejection_reason}` : ""}`,
    });

    res.status(200).json({ message: "Registration request rejected" });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: "Error rejecting registration request",
      error: err.message,
    });
  }
};

module.exports = {
  getAllRegistrations,
  getPendingRegistrations,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
};
