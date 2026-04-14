const Student = require('../models/Student');
const Snapshot = require('../models/Snapshot');

/**
 * Calculate overall, year-wise, and branch-wise rankings.
 * Optionally update snapshot ranks for a given date.
 */
async function calculateRankings(today = null) {
  console.log('[RANKING] Calculating rankings...');

  const students = await Student.find().sort({ 'scores.total': -1 });

  // Overall ranking
  for (let i = 0; i < students.length; i++) {
    students[i].ranks.overall = i + 1;
  }

  // Year-wise ranking
  const yearGroups = {};
  for (const s of students) {
    if (!yearGroups[s.year]) yearGroups[s.year] = [];
    yearGroups[s.year].push(s);
  }
  for (const year of Object.keys(yearGroups)) {
    const group = yearGroups[year].sort((a, b) => b.scores.total - a.scores.total);
    for (let i = 0; i < group.length; i++) {
      group[i].ranks.yearWise = i + 1;
    }
  }

  // Branch-wise ranking (within same year)
  const branchGroups = {};
  for (const s of students) {
    const key = `${s.year}-${s.branch}`;
    if (!branchGroups[key]) branchGroups[key] = [];
    branchGroups[key].push(s);
  }
  for (const key of Object.keys(branchGroups)) {
    const group = branchGroups[key].sort((a, b) => b.scores.total - a.scores.total);
    for (let i = 0; i < group.length; i++) {
      group[i].ranks.branchWise = i + 1;
    }
  }

  // Save all students and update snapshots
  for (const s of students) {
    await s.save();
    if (today) {
      await Snapshot.findOneAndUpdate(
        { rollno: s.rollno, date: today },
        { ranks: s.ranks },
      );
    }
  }

  console.log('[RANKING] Rankings updated');
}

module.exports = { calculateRankings };
