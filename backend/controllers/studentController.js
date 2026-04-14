const studentService = require('../services/studentService');
const { fetchNsutBranches, searchNsutStudents } = require('../utils/nsut');
const { getPlatform } = require('../platforms');

const getBranches = async (req, res) => {
  const branches = await fetchNsutBranches();
  if (!branches) return res.status(502).json({ error: 'Failed to fetch branches' });
  res.json(branches);
};

const searchStudents = async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query || query.length < 2) return res.json({ results: [] });

  // Search in our DB first
  const dbResults = await studentService.searchStudentsByName(query);

  // Also search NSUT API
  const nsutResults = await searchNsutStudents(query);

  // Merge: DB students marked as exists, NSUT students not yet in DB
  const dbRollNos = new Set(dbResults.map((s) => s.rollno));
  const results = [
    ...dbResults.map((s) => ({ ...s, exists: true })),
    ...nsutResults
      .filter((s) => !dbRollNos.has(s.rollno))
      .map((s) => ({ ...s, exists: false })),
  ];

  res.json({ results: results.slice(0, 10) });
};

const lookupStudent = async (req, res) => {
  const result = await studentService.lookupStudent(req.params.rollno);
  res.json(result);
};

const registerStudent = async (req, res) => {
  const student = await studentService.registerStudent(req.body);
  res.status(201).json({ message: 'Student registered successfully', student });
};

const getStudent = async (req, res) => {
  const student = await studentService.getStudentByRollNo(req.params.rollno);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
};

const updateUsernames = async (req, res) => {
  const student = await studentService.updateStudentUsernames(req.params.rollno, req.body);
  res.json({ message: 'Usernames updated successfully', student });
};

const restoreUsernames = async (req, res) => {
  const index = parseInt(req.body.index);
  const student = await studentService.restoreUsernames(req.params.rollno, index);
  res.json({ message: 'Usernames restored successfully', student });
};

const getHistory = async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const result = await studentService.getStudentHistory(req.params.rollno, days);
  res.json(result);
};

const validateUsername = async (req, res) => {
  const { platform: platformKey, username } = req.params;
  const platform = getPlatform(platformKey);
  if (!platform) return res.status(400).json({ valid: false, error: 'Unknown platform' });

  const valid = await platform.validateUsername(username);
  if (!valid) return res.json({ valid: false });

  // Fetch basic stats to show a preview
  const stats = await platform.fetchStats(username);
  res.json({ valid: true, stats });
};

module.exports = {
  getBranches,
  searchStudents,
  lookupStudent,
  registerStudent,
  getStudent,
  updateUsernames,
  restoreUsernames,
  getHistory,
  validateUsername,
};
