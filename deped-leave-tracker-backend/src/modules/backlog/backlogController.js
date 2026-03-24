const Backlog = require("./backlogModel");

const getAllBacklogs = async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    const pagination = page
      ? { page: Number(page), pageSize: Number(pageSize || 25) }
      : undefined;
    const results = await Backlog.getAll(pagination);

    if (!pagination) return res.status(200).json({ data: results });
    return res
      .status(200)
      .json({
        data: results.data,
        total: results.total,
        page: results.page,
        pageSize: results.pageSize,
      });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving backlogs", error: err.message });
  }
};

const getBacklogById = async (req, res) => {
  try {
    const result = await Backlog.getById(req.params.id);
    if (!result) return res.status(404).json({ message: "Backlog not found" });
    res.status(200).json({ data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving backlog", error: err.message });
  }
};

const getBacklogsByUser = async (req, res) => {
  try {
    const results = await Backlog.getByUser(req.params.user_id);
    res.status(200).json({ data: results });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving backlogs", error: err.message });
  }
};

const getBacklogsBySchool = async (req, res) => {
  try {
    const results = await Backlog.getBySchool(req.params.school_id);
    res.status(200).json({ data: results });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving backlogs", error: err.message });
  }
};

const createBacklog = async (req, res) => {
  try {
    const result = await Backlog.create(req.body);
    res
      .status(201)
      .json({ message: "Backlog created successfully", data: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating backlog", error: err.message });
  }
};

module.exports = {
  getAllBacklogs,
  getBacklogById,
  getBacklogsByUser,
  getBacklogsBySchool,
  createBacklog,
};
