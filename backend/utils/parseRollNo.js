/**
 * Parse a roll number string to extract year and branch.
 * Handles common Indian college roll number formats.
 */
function parseRollNo(rollno) {
  const result = { year: null, branch: null };

  // Pattern: 2-digit year at start followed by branch code (e.g., 21BCE1234)
  let match = rollno.match(/^(\d{2})([A-Z]{2,5})\d+$/i);
  if (match) {
    result.year = 2000 + parseInt(match[1]);
    result.branch = match[2].toUpperCase();
    return result;
  }

  // Pattern: 4-digit year at start (e.g., 2021CS001)
  match = rollno.match(/^(\d{4})([A-Z]{2,5})\d+$/i);
  if (match) {
    result.year = parseInt(match[1]);
    result.branch = match[2].toUpperCase();
    return result;
  }

  // Pattern: branch first then year (e.g., CSE21001)
  match = rollno.match(/^([A-Z]{2,5})(\d{2})\d+$/i);
  if (match) {
    result.branch = match[1].toUpperCase();
    result.year = 2000 + parseInt(match[2]);
    return result;
  }

  return result;
}

module.exports = { parseRollNo };
