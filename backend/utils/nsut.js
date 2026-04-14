const axios = require('axios');

const NSUT_API = process.env.NSUT_API_URL;

/**
 * Fetch student details from the NSUT external API.
 * Returns { name, branch, branchFull, year } or null if not found.
 */
async function lookupNsutStudent(rollno) {
  if (!NSUT_API) return null;

  try {
    const res = await axios.get(
      `${NSUT_API}/students/${encodeURIComponent(rollno)}`,
      { timeout: 5000 },
    );
    if (res.data?.success && res.data.data) {
      const d = res.data.data;
      return {
        rollno: d.rollNo || rollno,
        name: d.name || '',
        branch: d.branch?.shortName || '',
        branchFull: d.branch?.branchName || '',
        year: d.year ? parseInt(d.year) : null,
      };
    }
    return null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    console.error('NSUT API error:', err.message);
    return null;
  }
}

/**
 * Fetch available branches from the NSUT external API.
 */
async function fetchNsutBranches() {
  if (!NSUT_API) return null;

  const res = await axios.get(`${NSUT_API}/branches`, { timeout: 5000 });
  if (res.data?.success) return res.data.data;
  return null;
}

/**
 * Search NSUT students by name or roll number.
 * Returns array of { rollno, name, branch, branchFull, year }.
 */
async function searchNsutStudents(query) {
  if (!NSUT_API || !query) return [];

  try {
    const res = await axios.get(`${NSUT_API}/students`, {
      params: { search: query, page: 1 },
      timeout: 5000,
    });
    if (res.data?.success && res.data.data?.students) {
      return res.data.data.students.map((s) => ({
        rollno: s.rollNo || '',
        name: s.name || '',
        branch: s.branch?.shortName || '',
        branchFull: s.branch?.branchName || '',
        year: s.year ? parseInt(s.year) : null,
      }));
    }
    return [];
  } catch (err) {
    console.error('NSUT search error:', err.message);
    return [];
  }
}

module.exports = { lookupNsutStudent, fetchNsutBranches, searchNsutStudents };
