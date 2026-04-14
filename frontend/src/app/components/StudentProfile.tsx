import { useState, useEffect, useRef } from "react";
import { Link, useParams, Navigate } from "react-router";
import { ArrowLeft, ExternalLink, Edit3, X, Save, History, Clock, Share2, AlertTriangle, Plus, UserPlus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { platforms, type Platform } from "../mockData";
import { fetchStudent, fetchStudentHistory, updateUsernames as apiUpdateUsernames, restoreUsernames as apiRestoreUsernames } from "../api";
import { GithubIcon, LeetcodeIcon, CodeforcesIcon, CodechefIcon } from "./PlatformIcons";

export function StudentProfile() {
  const { rollNo } = useParams<{ rollNo: string }>();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editCooldown, setEditCooldown] = useState<number | null>(null); // hours remaining
  const [editData, setEditData] = useState({
    github: "",
    leetcode: "",
    codeforces: "",
    codechef: "",
  });
  const editSectionRef = useRef<HTMLDivElement>(null);

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      editSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  // Fetch student data
  useEffect(() => {
    if (!rollNo) return;
    setLoading(true);
    fetchStudent(rollNo)
      .then((data) => {
        setStudent(data);
        setEditData({
          github: data.github?.username || "",
          leetcode: data.leetcode?.username || "",
          codeforces: data.codeforces?.username || "",
          codechef: data.codechef?.username || "",
        });
        // Calculate cooldown
        if (data.lastEditedAt) {
          const elapsed = Date.now() - new Date(data.lastEditedAt).getTime();
          const cooldownMs = 24 * 60 * 60 * 1000;
          if (elapsed < cooldownMs) {
            setEditCooldown(Math.ceil((cooldownMs - elapsed) / 3600000));
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [rollNo]);

  // Fetch score history
  useEffect(() => {
    if (!rollNo) return;
    fetchStudentHistory(rollNo, 30)
      .then((data) => {
        setScoreHistory(
          data.snapshots.map((s: any) => ({
            date: s.date?.split("T")[0] || s.date,
            total: s.scores?.total ?? 0,
            github: s.scores?.github ?? 0,
            leetcode: s.scores?.leetcode ?? 0,
            codeforces: s.scores?.codeforces ?? 0,
            codechef: s.scores?.codechef ?? 0,
          }))
        );
      })
      .catch(() => {});
  }, [rollNo]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-[#888888]">
        Loading...
      </div>
    );
  }

  if (notFound || !student) {
    return <Navigate to="/" replace />;
  }

  // Profile completeness
  const linkedPlatforms = platforms.filter((p) => student[p]?.username).length;
  const completeness = Math.round((linkedPlatforms / platforms.length) * 100);
  const missingPlatforms = platforms.filter((p) => !student[p]?.username);

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out ${student.name}'s coding profile on CodeOvertake — ranked #${student.ranks?.overall ?? "??"}!`;
    if (navigator.share) {
      navigator.share({ title: "CodeOvertake Profile", text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Profile link copied!");
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case "github":
        return <GithubIcon />;
      case "leetcode":
        return <LeetcodeIcon />;
      case "codeforces":
        return <CodeforcesIcon />;
      case "codechef":
        return <CodechefIcon />;
    }
  };

  const getPlatformUrl = (platform: Platform, username: string) => {
    switch (platform) {
      case "github":
        return `https://github.com/${username}`;
      case "leetcode":
        return `https://leetcode.com/u/${username}`;
      case "codeforces":
        return `https://codeforces.com/profile/${username}`;
      case "codechef":
        return `https://www.codechef.com/users/${username}`;
    }
  };

  const getPlatformPrefix = (platform: Platform) => {
    switch (platform) {
      case "github":
        return "https://github.com/";
      case "leetcode":
        return "https://leetcode.com/";
      case "codeforces":
        return "https://codeforces.com/profile/";
      case "codechef":
        return "https://www.codechef.com/users/";
    }
  };

  const extractUsername = (platform: Platform, value: string) => {
    const prefix = getPlatformPrefix(platform);
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length).split("/")[0];
    }
    if (value.startsWith("http://") || value.startsWith("https://")) {
      const parts = value.split("/");
      return parts[parts.length - 1] || parts[parts.length - 2] || "";
    }
    return value;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const result = await apiUpdateUsernames(student.rollno, editData);
      setStudent(result.student);
      setIsEditing(false);
      // Set 24-hour cooldown
      setEditCooldown(24);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save");
    }
    setIsSaving(false);
  };

  const handleRestore = async (entry: any, idx: number) => {
    if (editCooldown !== null && editCooldown > 0) {
      return;
    }
    try {
      const result = await apiRestoreUsernames(student.rollno, idx);
      setStudent(result.student);
      setEditData({
        github: result.student.github?.username || "",
        leetcode: result.student.leetcode?.username || "",
        codeforces: result.student.codeforces?.username || "",
        codechef: result.student.codechef?.username || "",
      });
      setShowHistory(false);
      setEditCooldown(24);
    } catch (err: any) {
      setSaveError(err.message || "Failed to restore");
    }
  };

  return (
    <div
      className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      {/* Back Link */}
      <div
      >
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#888888] transition-all hover:text-white hover:gap-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leaderboard
        </Link>
      </div>

      {/* Profile Completeness Banner */}
      {completeness < 100 && (
        <div className="mb-4 flex flex-col gap-2 rounded border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-500" />
            <span className="text-yellow-200">
              Profile is {completeness}% complete. Add missing platforms to boost your score.
            </span>
          </div>
          <button
            onClick={startEditing}
            className="flex items-center gap-1.5 text-sm text-yellow-200 transition-opacity hover:opacity-80"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Now
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div
        className="mb-6 flex flex-col gap-4 rounded border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6"
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <img
            src={`https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(student.rollno)}`}
            alt={student.name}
            className="h-12 w-12 flex-shrink-0 rounded border border-[#1a1a1a] sm:h-16 sm:w-16"
          />
          <div className="min-w-0">
            <h1 className="mb-1 truncate font-['JetBrains_Mono'] text-xl tracking-tight sm:mb-2 sm:text-3xl">{student.name}</h1>
            <div className="space-y-0.5 text-xs text-[#888888] sm:space-y-1 sm:text-sm">
              <div className="font-['JetBrains_Mono']">{student.rollno}</div>
              <div>
                {student.branch} • {student.year}
              </div>
            </div>
            {/* Platform profile links */}
            <div className="mt-2 flex items-center gap-2 sm:mt-3 sm:gap-3">
              {platforms.map((platform) => {
                const username = student[platform]?.username;
                if (!username) return null;
                return (
                  <a
                    key={platform}
                    href={getPlatformUrl(platform, username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${platform}: ${username}`}
                    className="flex h-7 w-7 items-center justify-center rounded border border-[#1a1a1a] bg-[#111111] text-[#888888] transition-colors hover:border-[#333333] hover:text-white sm:h-8 sm:w-8"
                  >
                    <span className="h-4 w-4">{getPlatformIcon(platform)}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:block sm:text-right">
          <div className="flex items-baseline gap-2 sm:mb-1 sm:block">
            <div className="font-['JetBrains_Mono'] text-2xl sm:text-4xl">
              {student.scores?.total ?? 0}
            </div>
            <div className="text-xs text-[#888888] sm:text-sm">Total Score</div>
          </div>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded border border-[#1a1a1a] bg-[#111111] px-3 py-1.5 text-xs text-[#888888] transition-colors hover:border-[#333333] hover:text-white sm:mt-3"
          >
            <Share2 className="h-3 w-3" />
            Share Profile
          </button>
        </div>
      </div>

      {/* Rankings Row */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
        <div
          className="rounded border border-[#1a1a1a] bg-[#0a0a0a] p-3 text-center transition-shadow hover:shadow-lg hover:shadow-white/5 sm:p-4"
        >
          <div className="mb-0.5 font-['JetBrains_Mono'] text-lg sm:mb-1 sm:text-2xl">#{student.ranks?.overall ?? "—"}</div>
          <div className="text-[10px] text-[#888888] sm:text-xs">Overall Rank</div>
        </div>
        <div
          className="rounded border border-[#1a1a1a] bg-[#0a0a0a] p-3 text-center transition-shadow hover:shadow-lg hover:shadow-white/5 sm:p-4"
        >
          <div className="mb-0.5 font-['JetBrains_Mono'] text-lg sm:mb-1 sm:text-2xl">#{student.ranks?.yearWise ?? "—"}</div>
          <div className="text-[10px] text-[#888888] sm:text-xs">Year Rank</div>
        </div>
        <div
          className="rounded border border-[#1a1a1a] bg-[#0a0a0a] p-3 text-center transition-shadow hover:shadow-lg hover:shadow-white/5 sm:p-4"
        >
          <div className="mb-0.5 font-['JetBrains_Mono'] text-lg sm:mb-1 sm:text-2xl">#{student.ranks?.branchWise ?? "—"}</div>
          <div className="text-[10px] text-[#888888] sm:text-xs">Branch Rank</div>
        </div>
      </div>

      {/* Platform Stats Cards */}
      <div className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4">
        {platforms.map((platform, idx) => {
          const platformData = student[platform];
          const hasData = platformData?.username;
          const data = platformData?.stats;
          const score = student.scores?.[platform] ?? 0;
          const label = platform.charAt(0).toUpperCase() + platform.slice(1);

          return (
            <div
              key={platform}
              className="rounded border border-[#1a1a1a] bg-[#0a0a0a] p-4 transition-shadow hover:shadow-lg hover:shadow-white/5 sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-5 w-5"
                  >
                    {getPlatformIcon(platform)}
                  </div>
                  <h3 className="font-['JetBrains_Mono'] text-lg">{label}</h3>
                </div>
                {hasData && (
                  <div className="font-['JetBrains_Mono'] text-xl">{score}</div>
                )}
              </div>

              {hasData ? (
                <div className="space-y-3">
                  <a
                    href={getPlatformUrl(platform, platformData.username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 font-['JetBrains_Mono'] text-sm text-[#888888] transition-colors hover:text-white"
                  >
                    {platformData.username}
                    <div
                      className="h-3 w-3"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </a>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {platform === "github" && data && (
                      <>
                        <div>
                          <div className="text-[#666666]">Repos</div>
                          <div className="font-['JetBrains_Mono']">{data.publicRepos ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Stars</div>
                          <div className="font-['JetBrains_Mono']">{data.totalStars ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Followers</div>
                          <div className="font-['JetBrains_Mono']">{data.followers ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Contributions</div>
                          <div className="font-['JetBrains_Mono']">{data.contributions ?? 0}</div>
                        </div>
                      </>
                    )}
                    {platform === "leetcode" && data && (
                      <>
                        <div>
                          <div className="text-[#666666]">Total Solved</div>
                          <div className="font-['JetBrains_Mono']">{data.totalSolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Easy</div>
                          <div className="font-['JetBrains_Mono']">{data.easySolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Medium</div>
                          <div className="font-['JetBrains_Mono']">{data.mediumSolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Hard</div>
                          <div className="font-['JetBrains_Mono']">{data.hardSolved ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Contest Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.contestRating ?? 0}</div>
                        </div>
                      </>
                    )}
                    {platform === "codeforces" && data && (
                      <>
                        <div>
                          <div className="text-[#666666]">Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.rating ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Max Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.maxRating ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Rank</div>
                          <div className="font-['JetBrains_Mono']">{data.rank || "—"}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Problems Solved</div>
                          <div className="font-['JetBrains_Mono']">{data.problemsSolved ?? 0}</div>
                        </div>
                      </>
                    )}
                    {platform === "codechef" && data && (
                      <>
                        <div>
                          <div className="text-[#666666]">Current Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.currentRating ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Highest Rating</div>
                          <div className="font-['JetBrains_Mono']">{data.highestRating ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Stars</div>
                          <div className="font-['JetBrains_Mono']">{data.stars ?? 0}★</div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Problems Solved</div>
                          <div className="font-['JetBrains_Mono']">{data.totalProblemsSolved ?? 0}</div>
                        </div>
                        {data.globalRank > 0 && (
                          <div>
                            <div className="text-[#666666]">Global Rank</div>
                            <div className="font-['JetBrains_Mono']">{data.globalRank}</div>
                          </div>
                        )}
                        {data.countryRank > 0 && (
                          <div>
                            <div className="text-[#666666]">Country Rank</div>
                            <div className="font-['JetBrains_Mono']">{data.countryRank}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#666666]">Not linked</span>
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 text-xs text-[#888888] transition-colors hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                    Add username
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Usernames Section */}
      <div
        ref={editSectionRef}
        className="mb-6 rounded border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:mb-8 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-['JetBrains_Mono'] text-lg">Platform Usernames</h3>
          <div className="flex items-center gap-4">
            {student.usernameHistory && student.usernameHistory.length > 0 && !isEditing && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm text-[#888888] transition-colors hover:text-white"
              >
                <History className="h-4 w-4" />
                History
              </button>
            )}
            {!isEditing && (
              <div className="flex items-center gap-3">
                  {editCooldown !== null && editCooldown > 0 && (
                    <div
                      className="flex items-center gap-1 rounded bg-[#1a1a1a] px-2 py-1 text-xs text-[#888888]"
                    >
                      <Clock className="h-3 w-3" />
                      {editCooldown}h cooldown
                    </div>
                  )}
                <button
                  onClick={startEditing}
                  disabled={editCooldown !== null && editCooldown > 0}
                  className="flex items-center gap-2 text-sm text-[#888888] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {!isEditing ? (
          <div className="font-['JetBrains_Mono'] text-sm text-[#888888]">
            {platforms.map((platform, idx) => {
              const username = student[platform]?.username;
              const label = platform.charAt(0).toUpperCase() + platform.slice(1);
              return (
                <span key={platform}>
                  {label}: {username || "—"}
                  {idx < platforms.length - 1 && " | "}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded border border-[#1a1a1a] bg-black p-3 text-xs text-[#888888]">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Changes trigger a 24-hour edit cooldown
              </div>
            </div>
            {platforms.map((platform) => {
              const label = platform.charAt(0).toUpperCase() + platform.slice(1);
              const prefix = getPlatformPrefix(platform);
              const placeholder = platform === "github" ? "username" : platform === "leetcode" ? "u/username" : "username";
              return (
                <div key={platform}>
                  <label className="mb-2 flex items-center gap-2 text-sm text-[#888888]">
                    <span
                      className="h-4 w-4"
                    >
                      {getPlatformIcon(platform)}
                    </span>
                    {label}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-['JetBrains_Mono'] text-xs text-[#666666]">
                      {prefix}
                    </div>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={editData[platform]}
                      onChange={(e) => {
                        const extracted = extractUsername(platform, e.target.value);
                        setEditData({ ...editData, [platform]: extracted });
                      }}
                      style={{ paddingLeft: `calc(12px + ${prefix.length}ch)` }}
                      className="h-10 w-full rounded border border-[#1a1a1a] bg-black pr-3 font-['JetBrains_Mono'] text-xs text-white placeholder-[#555555] outline-none transition-all focus:border-[#333333] focus:shadow-lg focus:shadow-white/5"
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3">
              {saveError && (
                <div className="flex-1 text-sm text-[#ff4444]">{saveError}</div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex h-10 items-center gap-2 rounded bg-white px-4 text-sm text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSaveError("");
                  setEditData({
                    github: student?.github?.username || "",
                    leetcode: student?.leetcode?.username || "",
                    codeforces: student?.codeforces?.username || "",
                    codechef: student?.codechef?.username || "",
                  });
                }}
                className="flex h-10 items-center gap-2 rounded border border-[#1a1a1a] px-4 text-sm text-[#888888] transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Username History */}
          {showHistory && student.usernameHistory && (
            <div
              className="mt-6 space-y-3 border-t border-[#1a1a1a] pt-6"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-['JetBrains_Mono'] text-sm text-[#888888]">Previous Usernames</h4>
                <span className="text-xs text-[#666666]">Last {student.usernameHistory.length} entries</span>
              </div>
              {student.usernameHistory.map((entry: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded border border-[#1a1a1a] bg-black p-4"
                >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#666666]">
                    <Clock className="h-3 w-3" />
                    {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : "—"}
                    {idx === 0 && student.usernameHistory.length > 1 && (
                      <span className="ml-2 rounded bg-[#1a1a1a] px-2 py-0.5 text-[#888888]">(original)</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRestore(entry, idx)}
                    disabled={editCooldown !== null && editCooldown > 0}
                    className="text-xs text-[#888888] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Use this
                  </button>
                </div>
                <div className="font-['JetBrains_Mono'] text-xs text-[#888888]">
                  {platforms.map((platform, pidx) => {
                    const usernames = entry.usernames || {};
                    const username = typeof usernames.get === "function" ? usernames.get(platform) : usernames[platform];
                    const label = platform.charAt(0).toUpperCase() + platform.slice(1);
                    return (
                      <span key={platform}>
                        {label}: {username || "—"}
                        {pidx < platforms.length - 1 && " | "}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>
          )}
      </div>

      {/* Score History Chart */}
      {scoreHistory.length >= 1 && (
        <div
          className="rounded border border-[#1a1a1a] bg-[#0a0a0a] p-6"
        >
          <h3 className="mb-6 font-['JetBrains_Mono'] text-lg">Score History (Last 30 Days)</h3>
          {scoreHistory.length === 1 ? (
            <div className="text-center font-['Archivo'] text-sm text-[#666666] py-8">
              <div className="mb-2 font-['JetBrains_Mono'] text-2xl text-white">{scoreHistory[0].total}</div>
              <div>First snapshot recorded on {new Date(scoreHistory[0].date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
              <div className="mt-1 text-xs">Graph will appear once more data points are collected.</div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                style={{ fontSize: "12px", fontFamily: "JetBrains Mono" }}
                tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis stroke="#888888" style={{ fontSize: "12px", fontFamily: "JetBrains Mono" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0a0a",
                  border: "1px solid #1a1a1a",
                  borderRadius: "4px",
                  fontFamily: "JetBrains Mono",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#888888" }}
              />
              <Legend
                wrapperStyle={{
                  fontFamily: "JetBrains Mono",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="total" stroke="#ffffff" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="github" stroke="#ffffff" strokeWidth={1.5} strokeOpacity={0.6} name="GitHub" />
              <Line type="monotone" dataKey="leetcode" stroke="#ffa116" strokeWidth={1.5} name="LeetCode" />
              <Line type="monotone" dataKey="codeforces" stroke="#1f8acb" strokeWidth={1.5} name="Codeforces" />
              <Line type="monotone" dataKey="codechef" stroke="#5b4638" strokeWidth={1.5} name="CodeChef" />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Social / Viral Section */}
      <div className="mt-6 flex flex-col gap-3 rounded border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
        <div className="space-y-1">
          <div className="text-sm">Challenge your friends</div>
          <div className="text-xs text-[#666666]">Know someone missing? Add them to the leaderboard.</div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/register"
            className="flex items-center gap-2 rounded border border-[#1a1a1a] px-4 py-2 text-xs text-[#888888] transition-colors hover:border-[#333333] hover:text-white"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Someone
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded bg-white px-4 py-2 text-xs text-black transition-opacity hover:opacity-90"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Profile
          </button>
        </div>
      </div>
    </div>
  );
}
