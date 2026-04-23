const EService = require("./eserviceModel");

const getAllEmployeePersonalInfo = async (req, res) => {
  try {
    const {
      search,
      district,
      school,
      civilStatus,
      sex,
      employeeType,
      letter,
      sortOrder,
      page,
      pageSize,
    } = req.query;

    const filters = {
      search: search || null,
      district: district || null,
      school: school || null,
      civilStatus: civilStatus || null,
      sex: sex || null,
      employeeType: employeeType || null,
      letter: letter || null,
      sortOrder: sortOrder || "DESC",
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    };

    const results = await EService.getAll(filters);

    if (!filters.page) {
      return res.status(200).json({ data: results });
    }

    return res.status(200).json({
      data: results.data,
      total: results.total,
      page: results.page,
      pageSize: results.pageSize,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving employee personal information",
      error: err.message,
    });
  }
};

const getEmployeePersonalInfoById = async (req, res) => {
  try {
    const result = await EService.getById(req.params.id);

    if (!result) {
      return res.status(404).json({
        message: "Employee personal information not found",
      });
    }

    return res.status(200).json({ data: result });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving employee personal information",
      error: err.message,
    });
  }
};

const createEmployeePersonalInfo = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      district,
      school,
      gender,
      civilStatus,
    } = req.body;

    if (!firstName || !String(firstName).trim()) {
      return res.status(400).json({
        message: "First name is required",
      });
    }

    if (!lastName || !String(lastName).trim()) {
      return res.status(400).json({
        message: "Last name is required",
      });
    }

    if (!district || !String(district).trim()) {
      return res.status(400).json({
        message: "District is required",
      });
    }

    if (!school || !String(school).trim()) {
      return res.status(400).json({
        message: "School is required",
      });
    }

    if (!gender || !String(gender).trim()) {
      return res.status(400).json({
        message: "Sex is required",
      });
    }

    if (!civilStatus || !String(civilStatus).trim()) {
      return res.status(400).json({
        message: "Civil status is required",
      });
    }

    const result = await EService.create(req.body);

    return res.status(201).json({
      message: "Employee personal information created successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error creating employee personal information",
      error: err.message,
    });
  }
};

const updateEmployeePersonalInfo = async (req, res) => {
  try {
    const existing = await EService.getById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Employee personal information not found",
      });
    }

    const result = await EService.update(req.params.id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Employee personal information not found",
      });
    }

    return res.status(200).json({
      message: "Employee personal information updated successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error updating employee personal information",
      error: err.message,
    });
  }
};

const deleteEmployeePersonalInfo = async (req, res) => {
  try {
    const existing = await EService.getById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Employee personal information not found",
      });
    }

    const result = await EService.delete(req.params.id);

    return res.status(200).json({
      message: "Employee personal information deleted successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error deleting employee personal information",
      error: err.message,
    });
  }
};

const getDistricts = async (req, res) => {
  try {
    const results = await EService.getDistricts();
    return res.status(200).json({ data: results });
  } catch (err) {
    console.error("[ESERVICE DISTRICTS ERROR]", err);
    return res.status(500).json({
      message: "Error retrieving districts",
      error: err.message,
    });
  }
};

const getSchools = async (req, res) => {
  try {
    const { district } = req.query;

    const results = await EService.getSchools(district || null);

    return res.status(200).json({ data: results });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving schools",
      error: err.message,
    });
  }
};

module.exports = {
  getAllEmployeePersonalInfo,
  getEmployeePersonalInfoById,
  createEmployeePersonalInfo,
  updateEmployeePersonalInfo,
  deleteEmployeePersonalInfo,
  getDistricts,
  getSchools,
};