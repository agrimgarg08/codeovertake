const axios = require('axios');

const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

async function fetchStats(username) {
  if (!username) return null;

  try {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const userRes = await axios.get(
      `${GITHUB_API}/users/${encodeURIComponent(username)}`,
      { headers, timeout: 10000 }
    );
    const user = userRes.data;

    let totalStars = 0;
    let page = 1;
    while (true) {
      const reposRes = await axios.get(
        `${GITHUB_API}/users/${encodeURIComponent(username)}/repos`,
        { headers, params: { per_page: 100, page, type: 'owner', sort: 'updated' }, timeout: 10000 }
      );
      const repos = reposRes.data;
      totalStars += repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
      if (repos.length < 100) break;
      page++;
    }

    let contributions = 0;
    if (process.env.GITHUB_TOKEN) {
      try {
        const query = `query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar { totalContributions }
            }
          }
        }`;
        const gqlRes = await axios.post(
          GITHUB_GRAPHQL,
          { query, variables: { username } },
          { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }, timeout: 10000 }
        );
        contributions =
          gqlRes.data?.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions || 0;
      } catch (_) {}
    }

    return {
      publicRepos: user.public_repos || 0,
      followers: user.followers || 0,
      totalStars,
      contributions,
    };
  } catch (error) {
    if (error.response?.status === 404) return null;
    console.error(`GitHub fetch error for ${username}:`, error.message);
    return null;
  }
}

async function validateUsername(username) {
  try {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    await axios.get(`${GITHUB_API}/users/${encodeURIComponent(username)}`, { headers, timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

function calculateScore(stats) {
  if (!stats) return 0;
  const { publicRepos = 0, totalStars = 0, followers = 0, contributions = 0 } = stats;
  const contribScore = Math.min(600, Math.round(600 * (1 - Math.exp(-contributions / 250))));
  const repoScore = Math.min(100, Math.round(100 * (1 - Math.exp(-publicRepos / 12))));
  const starScore = Math.min(200, Math.round(200 * (1 - Math.exp(-totalStars / 8))));
  const followerScore = Math.min(100, Math.round(100 * (1 - Math.exp(-followers / 8))));
  return Math.min(1000, contribScore + repoScore + starScore + followerScore);
}

async function fetchHeatmap(username) {
  if (!username || !process.env.GITHUB_TOKEN) return null;
  try {
    const query = `query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }`;
    const res = await axios.post(
      GITHUB_GRAPHQL,
      { query, variables: { username } },
      { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }, timeout: 10000 }
    );
    const weeks = res.data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
    if (!weeks) return null;
    const data = {};
    for (const week of weeks) {
      for (const day of week.contributionDays) {
        if (day.contributionCount > 0) {
          data[day.date] = day.contributionCount;
        }
      }
    }
    return data;
  } catch {
    return null;
  }
}

module.exports = {
  key: 'github',
  label: 'GitHub',
  fetchStats,
  validateUsername,
  calculateScore,
  fetchHeatmap,
  profileUrl: (username) => `https://github.com/${username}`,
  leaderboardFields: 'rollno name branch year scores.github github.username github.stats ranks',
  leaderboardHeaders: [
    { label: 'Repos', statKey: 'github.stats.publicRepos' },
    { label: 'Stars', statKey: 'github.stats.totalStars' },
    { label: 'Followers', statKey: 'github.stats.followers' },
    { label: 'Contributions', statKey: 'github.stats.contributions' },
  ],
  profileStats: [
    { label: 'Repos', statKey: 'stats.publicRepos' },
    { label: 'Stars', statKey: 'stats.totalStars' },
    { label: 'Followers', statKey: 'stats.followers' },
    { label: 'Contributions', statKey: 'stats.contributions' },
  ],
};
