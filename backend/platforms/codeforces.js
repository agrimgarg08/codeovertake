const axios = require('axios');

const CF_API = 'https://codeforces.com/api';

async function fetchStats(username) {
  if (!username) return null;
  try {
    const infoRes = await axios.get(`${CF_API}/user.info`, {
      params: { handles: username }, timeout: 10000,
    });
    if (infoRes.data.status !== 'OK' || !infoRes.data.result?.length) return null;
    const user = infoRes.data.result[0];

    let problemsSolved = 0;
    try {
      const statusRes = await axios.get(`${CF_API}/user.status`, {
        params: { handle: username, from: 1, count: 10000 }, timeout: 15000,
      });
      if (statusRes.data.status === 'OK') {
        const solved = new Set();
        for (const sub of statusRes.data.result) {
          if (sub.verdict === 'OK') solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
        }
        problemsSolved = solved.size;
      }
    } catch (_) {}

    return {
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || 'unrated',
      maxRank: user.maxRank || 'unrated',
      problemsSolved,
    };
  } catch (error) {
    if (error.response?.status === 400) return null;
    console.error(`Codeforces fetch error for ${username}:`, error.message);
    return null;
  }
}

async function validateUsername(username) {
  try {
    const res = await axios.get(`${CF_API}/user.info`, {
      params: { handles: username }, timeout: 10000,
    });
    return res.data.status === 'OK' && res.data.result?.length > 0;
  } catch {
    return false;
  }
}

function calculateScore(stats) {
  if (!stats) return 0;
  const { rating = 0, maxRating = 0, problemsSolved = 0 } = stats;
  const solvedScore = Math.min(500, Math.round(500 * (1 - Math.exp(-problemsSolved / 400))));
  const ratingScore = Math.min(400, Math.round((rating / 2000) * 400));
  const maxRatingScore = Math.min(100, Math.round((maxRating / 2000) * 100));
  return Math.min(1000, solvedScore + ratingScore + maxRatingScore);
}

async function fetchHeatmap(username) {
  if (!username) return null;
  try {
    const res = await axios.get(`${CF_API}/user.status`, {
      params: { handle: username, from: 1, count: 10000 }, timeout: 15000,
    });
    if (res.data.status !== 'OK') return null;
    const data = {};
    for (const sub of res.data.result) {
      if (sub.verdict === 'OK') {
        const d = new Date(sub.creationTimeSeconds * 1000);
        const key = d.toISOString().split('T')[0];
        data[key] = (data[key] || 0) + 1;
      }
    }
    return data;
  } catch {
    return null;
  }
}

module.exports = {
  key: 'codeforces',
  label: 'Codeforces',
  fetchStats,
  validateUsername,
  calculateScore,
  fetchHeatmap,
  profileUrl: (username) => `https://codeforces.com/profile/${username}`,
  leaderboardFields: 'rollno name branch year scores.codeforces codeforces.username codeforces.stats ranks',
  leaderboardHeaders: [
    { label: 'Rating', statKey: 'codeforces.stats.rating' },
    { label: 'Max Rating', statKey: 'codeforces.stats.maxRating' },
    { label: 'Rank', statKey: 'codeforces.stats.rank' },
    { label: 'Solved', statKey: 'codeforces.stats.problemsSolved' },
  ],
  profileStats: [
    { label: 'Rating', statKey: 'stats.rating' },
    { label: 'Max Rating', statKey: 'stats.maxRating' },
    { label: 'Rank', statKey: 'stats.rank' },
    { label: 'Problems Solved', statKey: 'stats.problemsSolved' },
  ],
};
