const Student = require('../models/Student');
const Snapshot = require('../models/Snapshot');

const PLATFORM_KEYS = ['github', 'leetcode', 'codeforces', 'codechef'];
const SCORE_BUCKETS = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 5000];

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

async function getOverview() {
  const [
    totalStudents,
    linkedStudents,
    currentScoreAgg,
    platformCoverageAgg,
    branchDistribution,
    yearDistribution,
    scoreDistribution,
    topStudents,
    latestSnapshotDates,
    registrationTrendRaw,
  ] = await Promise.all([
    Student.countDocuments({}),
    Student.countDocuments({
      $or: PLATFORM_KEYS.map((key) => ({ [`${key}.username`]: { $ne: '' } })),
    }),
    Student.aggregate([
      {
        $group: {
          _id: null,
          averageTotal: { $avg: '$scores.total' },
          maxTotal: { $max: '$scores.total' },
          averageGithub: { $avg: '$scores.github' },
          averageLeetcode: { $avg: '$scores.leetcode' },
          averageCodeforces: { $avg: '$scores.codeforces' },
          averageCodechef: { $avg: '$scores.codechef' },
        },
      },
    ]),
    Student.aggregate([
      {
        $group: {
          _id: null,
          github: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$github.username', null] }, { $ne: ['$github.username', ''] }] }, 1, 0],
            },
          },
          leetcode: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$leetcode.username', null] }, { $ne: ['$leetcode.username', ''] }] }, 1, 0],
            },
          },
          codeforces: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$codeforces.username', null] }, { $ne: ['$codeforces.username', ''] }] }, 1, 0],
            },
          },
          codechef: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$codechef.username', null] }, { $ne: ['$codechef.username', ''] }] }, 1, 0],
            },
          },
        },
      },
    ]),
    Student.aggregate([
      { $group: { _id: '$branch', count: { $sum: 1 }, averageScore: { $avg: '$scores.total' } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Student.aggregate([
      { $group: { _id: '$year', count: { $sum: 1 }, averageScore: { $avg: '$scores.total' } } },
      { $sort: { _id: 1 } },
    ]),
    Student.aggregate([
      {
        $bucket: {
          groupBy: '$scores.total',
          boundaries: SCORE_BUCKETS,
          default: 'unknown',
          output: { count: { $sum: 1 } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Student.find({})
      .sort({ 'scores.total': -1 })
      .limit(5)
      .select('rollno name branch year scores.total ranks.overall'),
    Snapshot.aggregate([
      { $group: { _id: '$date' } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
      { $sort: { _id: 1 } },
    ]),
    Student.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const trendDates = latestSnapshotDates.map((d) => d._id);
  const trend = trendDates.length
    ? await Snapshot.aggregate([
        { $match: { date: { $in: trendDates } } },
        {
          $group: {
            _id: '$date',
            avgTotal: { $avg: '$scores.total' },
            maxTotal: { $max: '$scores.total' },
            avgGithub: { $avg: '$scores.github' },
            avgLeetcode: { $avg: '$scores.leetcode' },
            avgCodeforces: { $avg: '$scores.codeforces' },
            avgCodechef: { $avg: '$scores.codechef' },
            studentCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
    : [];

  const current = currentScoreAgg[0] || {};
  const platformCoverage = platformCoverageAgg[0] || {};

  const latestTrend = trend[trend.length - 1];
  const previousTrend = trend[trend.length - 2];

  const averageDelta = latestTrend && previousTrend ? latestTrend.avgTotal - previousTrend.avgTotal : 0;

  return {
    summary: {
      totalStudents,
      linkedStudents,
      linkedPercentage: totalStudents ? round((linkedStudents / totalStudents) * 100) : 0,
      averageTotalScore: round(current.averageTotal || 0),
      maxTotalScore: current.maxTotal || 0,
      averageDeltaFromPreviousSnapshot: round(averageDelta),
      latestSnapshotDate: latestTrend ? formatDate(latestTrend._id) : null,
    },
    platformCoverage: PLATFORM_KEYS.map((key) => ({
      platform: key,
      linkedCount: platformCoverage[key] || 0,
      linkedPercentage: totalStudents ? round(((platformCoverage[key] || 0) / totalStudents) * 100) : 0,
      averageScore: round(current[`average${key.charAt(0).toUpperCase()}${key.slice(1)}`] || 0),
    })),
    branchDistribution: branchDistribution.map((item) => ({
      branch: item._id,
      count: item.count,
      averageScore: round(item.averageScore || 0),
    })),
    yearDistribution: yearDistribution.map((item) => ({
      year: item._id,
      count: item.count,
      averageScore: round(item.averageScore || 0),
    })),
    scoreDistribution: SCORE_BUCKETS.slice(0, -1).map((start, index) => {
      const end = SCORE_BUCKETS[index + 1] - 1;
      const bucket = scoreDistribution.find((item) => item._id === start);
      return {
        range: `${start}-${end}`,
        count: bucket?.count || 0,
      };
    }),
    trend: trend.map((item) => ({
      date: formatDate(item._id),
      avgTotal: round(item.avgTotal || 0),
      maxTotal: item.maxTotal || 0,
      avgGithub: round(item.avgGithub || 0),
      avgLeetcode: round(item.avgLeetcode || 0),
      avgCodeforces: round(item.avgCodeforces || 0),
      avgCodechef: round(item.avgCodechef || 0),
      students: item.studentCount || 0,
    })),
    topStudents: topStudents.map((student) => ({
      rollno: student.rollno,
      name: student.name,
      branch: student.branch,
      year: student.year,
      totalScore: student.scores?.total || 0,
      overallRank: student.ranks?.overall || null,
    })),
    registrationsTrend: registrationTrendRaw.map((item) => ({
      date: item._id,
      count: item.count,
    })),
  };
}

module.exports = {
  getOverview,
};
