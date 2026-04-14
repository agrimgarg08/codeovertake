import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";
import { Search, Rocket, Zap, TrendingUp, ArrowUpRight, Loader2 } from "lucide-react";
import { platforms, type Platform } from "../mockData";
import { fetchLeaderboard, fetchPlatformLeaderboard, fetchFilters, fetchTopGainers } from "../api";
import { GithubIcon, LeetcodeIcon, CodeforcesIcon, CodechefIcon } from "./PlatformIcons";

const ITEMS_PER_PAGE = 20;

type TabType = "all" | Platform;

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  // displayTab tracks which tab's columns to render — updated after data arrives
  const [displayTab, setDisplayTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fading, setFading] = useState(false);
  const [filterYears, setFilterYears] = useState<number[]>([]);
  const [filterBranches, setFilterBranches] = useState<string[]>([]);
  const [platformMeta, setPlatformMeta] = useState<any[]>([]);
  const fetchIdRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [gainersPeriod, setGainersPeriod] = useState<{ from: string; to: string } | null>(null);

  // Load filter options and top gainers once
  useEffect(() => {
    fetchFilters().then((data) => {
      setFilterYears(data.years);
      setFilterBranches(data.branches);
      setPlatformMeta(data.platforms);
    }).catch(() => {});
    fetchTopGainers(5).then((data) => {
      setTopGainers(data.gainers);
      setGainersPeriod(data.period);
    }).catch(() => {});
  }, []);

  // Fetch leaderboard data — append mode for infinite scroll
  const loadData = useCallback(async (append = false) => {
    const id = ++fetchIdRef.current;
    if (append) {
      setLoadingMore(true);
    } else {
      setFading(true);
    }
    try {
      const page = append ? currentPage : 1;
      const params: any = { page, limit: ITEMS_PER_PAGE };
      if (selectedYear !== "all") params.year = selectedYear;
      if (selectedBranch !== "all") params.branch = selectedBranch;
      if (searchQuery) params.search = searchQuery;

      let result;
      if (activeTab === "all") {
        result = await fetchLeaderboard(params);
      } else {
        result = await fetchPlatformLeaderboard(activeTab, params);
      }
      if (id !== fetchIdRef.current) return; // stale request
      if (append) {
        setStudents((prev) => [...prev, ...result.students]);
      } else {
        setStudents(result.students);
      }
      setTotalPages(result.pagination.pages);
      setTotalCount(result.pagination.total);
      setDisplayTab(activeTab);
    } catch {
      if (id !== fetchIdRef.current) return;
      if (!append) {
        setStudents([]);
        setTotalPages(1);
        setTotalCount(0);
      }
      setDisplayTab(activeTab);
    }
    setInitialLoad(false);
    setFading(false);
    setLoadingMore(false);
  }, [activeTab, searchQuery, selectedYear, selectedBranch, currentPage]);

  // Initial load and filter changes — reset to page 1
  useEffect(() => {
    setCurrentPage(1);
    loadData(false);
  }, [activeTab, searchQuery, selectedYear, selectedBranch]);

  // Load more when page increments
  useEffect(() => {
    if (currentPage > 1) {
      loadData(true);
    }
  }, [currentPage]);

  // Infinite scroll — IntersectionObserver on sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && currentPage < totalPages) {
          setCurrentPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadingMore, currentPage, totalPages]);

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

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Global CTA Banner */}
      <div className="mb-4 flex flex-col gap-3 rounded border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3 text-sm">
          <Rocket className="hidden h-4 w-4 flex-shrink-0 text-[#888888] sm:block" />
          <span className="text-[#888888]">
            <span className="font-['JetBrains_Mono'] text-white">{totalCount}</span> students ranked.
            Not on the leaderboard yet?
          </span>
        </div>
        <Link
          to="/register"
          className="flex w-full items-center justify-center gap-2 rounded bg-white px-4 py-1.5 font-['Archivo'] text-sm text-black transition-opacity hover:opacity-90 sm:w-auto"
        >
          <Zap className="h-3.5 w-3.5" />
          Claim Your Spot
        </Link>
      </div>

      {/* Top Gainers */}
      {topGainers.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#4ade80]" />
            <h2 className="font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Top Gainers</h2>
            {gainersPeriod && (
              <span className="text-xs text-[#666666]">
                {gainersPeriod.from} → {gainersPeriod.to}
              </span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {topGainers.map((g, i) => (
              <Link
                key={g.rollno}
                to={`/student/${g.rollno}`}
                className="flex items-center gap-3 rounded border border-[#1a1a1a] bg-[#0a0a0a] p-3 transition-colors hover:border-[#333333]"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-[#1a1a1a] font-['JetBrains_Mono'] text-xs text-[#888888]">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{g.name}</div>
                  <div className="font-['JetBrains_Mono'] text-xs text-[#666666]">{g.rollno}</div>
                </div>
                <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-sm text-[#4ade80]">
                  <ArrowUpRight className="h-3 w-3" />
                  +{g.gain}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Page Title */}
      <h1 className="mb-6 font-['JetBrains_Mono'] text-2xl tracking-tight sm:mb-8 sm:text-3xl">
        Coding Leaderboard
      </h1>

      {/* Platform Tabs */}
      <div className="no-scrollbar -mx-3 mb-6 flex gap-1 overflow-x-auto border-b border-[#1a1a1a] px-3 font-['Archivo'] sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("all")}
          className={`relative flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
            activeTab === "all"
              ? "border-white text-white"
              : "border-transparent text-[#888888] hover:text-white"
          }`}
        >
          All Combined
        </button>
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setActiveTab(platform)}
            className={`relative flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
              activeTab === platform
                ? "border-white text-white"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            <span className="h-4 w-4">{getPlatformIcon(platform)}</span>
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Search by name or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded border border-[#1a1a1a] bg-[#0a0a0a] pl-10 pr-4 text-sm text-white placeholder-[#888888] outline-none transition-colors focus:border-[#333333]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="h-10 rounded border border-[#1a1a1a] bg-[#0a0a0a] px-3 text-sm text-white outline-none transition-colors focus:border-[#333333] sm:px-4"
          >
            <option value="all">All Years</option>
            {filterYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Branch Dropdown */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-10 rounded border border-[#1a1a1a] bg-[#0a0a0a] px-3 text-sm text-white outline-none transition-colors focus:border-[#333333] sm:px-4"
          >
            <option value="all">All Branches</option>
            {filterBranches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className={`space-y-3 sm:hidden transition-opacity duration-200 ${fading ? "opacity-40" : "opacity-100"}`}>
        {initialLoad ? (
          <div className="rounded border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center text-[#888888]">Loading...</div>
        ) : students.length === 0 ? (
          <div className="rounded border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
            <div className="text-[#888888]">No students found</div>
            {searchQuery && (
              <div className="mt-3">
                <div className="mb-2 text-sm text-[#666666]">You&apos;re not on the leaderboard yet.</div>
                <Link to="/register" className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm text-black">
                  <Zap className="h-3.5 w-3.5" /> Claim Your Spot
                </Link>
              </div>
            )}
          </div>
        ) : (
          students.map((student, idx) => {
            const rank = idx + 1;
            return (
              <Link
                key={`${student.rollno}-${idx}`}
                to={`/student/${student.rollno}`}
                className="block rounded border border-[#1a1a1a] bg-[#0a0a0a] p-4 transition-colors hover:border-[#333333]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#1a1a1a] font-['JetBrains_Mono'] text-sm text-[#888888]">
                      {rank}
                    </div>
                    <div>
                      <div className="font-['Archivo'] text-sm">{student.name}</div>
                      <div className="mt-0.5 font-['JetBrains_Mono'] text-xs text-[#888888]">{student.rollno}</div>
                      <div className="mt-0.5 text-xs text-[#666666]">{student.branch} • {student.year}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-['JetBrains_Mono'] text-lg text-white">
                      {displayTab === "all" ? (student.scores?.total ?? 0) : (student.scores?.[displayTab] ?? 0)}
                    </div>
                    <div className="text-[10px] text-[#666666]">{displayTab === "all" ? "Total" : "Score"}</div>
                  </div>
                </div>
                {displayTab === "all" && (
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-[#1a1a1a] pt-3">
                    {platforms.map((p) => (
                      <div key={p} className="text-center">
                        <div className="mx-auto mb-1 h-3.5 w-3.5 text-[#888888]">{getPlatformIcon(p)}</div>
                        <div className="font-['JetBrains_Mono'] text-xs">{student.scores?.[p] ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                )}
                {displayTab === "github" && student.github?.stats && (
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-[#1a1a1a] pt-3 text-center text-xs">
                    <div><div className="text-[#666666]">Repos</div><div className="font-['JetBrains_Mono']">{student.github.stats.publicRepos ?? 0}</div></div>
                    <div><div className="text-[#666666]">Stars</div><div className="font-['JetBrains_Mono']">{student.github.stats.totalStars ?? 0}</div></div>
                    <div><div className="text-[#666666]">Followers</div><div className="font-['JetBrains_Mono']">{student.github.stats.followers ?? 0}</div></div>
                    <div><div className="text-[#666666]">Contribs</div><div className="font-['JetBrains_Mono']">{student.github.stats.contributions ?? 0}</div></div>
                  </div>
                )}
                {displayTab === "leetcode" && student.leetcode?.stats && (
                  <div className="mt-3 grid grid-cols-5 gap-2 border-t border-[#1a1a1a] pt-3 text-center text-xs">
                    <div><div className="text-[#666666]">Easy</div><div className="font-['JetBrains_Mono']">{student.leetcode.stats.easySolved ?? 0}</div></div>
                    <div><div className="text-[#666666]">Med</div><div className="font-['JetBrains_Mono']">{student.leetcode.stats.mediumSolved ?? 0}</div></div>
                    <div><div className="text-[#666666]">Hard</div><div className="font-['JetBrains_Mono']">{student.leetcode.stats.hardSolved ?? 0}</div></div>
                    <div><div className="text-[#666666]">Total</div><div className="font-['JetBrains_Mono']">{student.leetcode.stats.totalSolved ?? 0}</div></div>
                    <div><div className="text-[#666666]">Contest</div><div className="font-['JetBrains_Mono']">{student.leetcode.stats.contestRating ?? 0}</div></div>
                  </div>
                )}
                {displayTab === "codeforces" && student.codeforces?.stats && (
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-[#1a1a1a] pt-3 text-center text-xs">
                    <div><div className="text-[#666666]">Rating</div><div className="font-['JetBrains_Mono']">{student.codeforces.stats.rating ?? 0}</div></div>
                    <div><div className="text-[#666666]">Max</div><div className="font-['JetBrains_Mono']">{student.codeforces.stats.maxRating ?? 0}</div></div>
                    <div><div className="text-[#666666]">Rank</div><div className="font-['JetBrains_Mono'] truncate">{student.codeforces.stats.rank ?? "—"}</div></div>
                    <div><div className="text-[#666666]">Solved</div><div className="font-['JetBrains_Mono']">{student.codeforces.stats.problemsSolved ?? 0}</div></div>
                  </div>
                )}
                {displayTab === "codechef" && student.codechef?.stats && (
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-[#1a1a1a] pt-3 text-center text-xs">
                    <div><div className="text-[#666666]">Rating</div><div className="font-['JetBrains_Mono']">{student.codechef.stats.currentRating ?? 0}</div></div>
                    <div><div className="text-[#666666]">Max</div><div className="font-['JetBrains_Mono']">{student.codechef.stats.highestRating ?? 0}</div></div>
                    <div><div className="text-[#666666]">Stars</div><div className="font-['JetBrains_Mono']">{student.codechef.stats.stars ?? 0}★</div></div>
                    <div><div className="text-[#666666]">Solved</div><div className="font-['JetBrains_Mono']">{student.codechef.stats.totalProblemsSolved ?? 0}</div></div>
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop Data Table */}
      <div
        className={`hidden overflow-x-auto overflow-y-visible rounded border border-[#1a1a1a] transition-opacity duration-200 sm:block ${fading ? "opacity-40" : "opacity-100"}`}
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#1a1a1a] bg-[#0a0a0a] font-['JetBrains_Mono']">
            {displayTab === "all" ? (
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">#</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Name</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Roll No</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Branch</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Year</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">GitHub</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">LeetCode</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Codeforces</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">CodeChef</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Total</th>
              </tr>
            ) : (
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">#</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Name</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Roll No</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Branch</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Year</th>
                {displayTab === "github" && (
                  <>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Repos</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Stars</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Followers</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Contributions</th>
                  </>
                )}
                {displayTab === "leetcode" && (
                  <>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Easy</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Medium</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Hard</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Total</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Contest</th>
                  </>
                )}
                {displayTab === "codeforces" && (
                  <>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Rating</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Max Rating</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Rank</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Solved</th>
                  </>
                )}
                {displayTab === "codechef" && (
                  <>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Rating</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Max Rating</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Stars</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Solved</th>
                  </>
                )}
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888888]">Score</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-[#1a1a1a] font-['Archivo']">
            {initialLoad ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-[#888888]">
                  Loading...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center">
                  <div className="space-y-3">
                    <div className="text-[#888888]">No students found</div>
                    {searchQuery && (
                      <div>
                        <div className="mb-2 text-sm text-[#666666]">You&apos;re not on the leaderboard yet.</div>
                        <Link
                          to="/register"
                          className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm text-black transition-opacity hover:opacity-90"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Claim Your Spot
                        </Link>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={`${student.rollno}-${idx}`} className="transition-colors hover:bg-[#0a0a0a]">
                    <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#888888]">{rank}</td>
                    <td className="max-w-[250px] px-4 py-3">
                      <Link
                        to={`/student/${student.rollno}`}
                        className="block truncate transition-colors hover:text-white hover:underline"
                        title={student.name}
                      >
                        {student.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#888888]">{student.rollno}</td>
                    <td className="px-4 py-3 text-[#888888]">{student.branch}</td>
                    <td className="px-4 py-3 text-[#888888]">{student.year}</td>
                    {displayTab === "all" ? (
                      <>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">
                          {student.scores?.github ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">
                          {student.scores?.leetcode ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">
                          {student.scores?.codeforces ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">
                          {student.scores?.codechef ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-['JetBrains_Mono'] text-white">{student.scores?.total ?? 0}</td>
                      </>
                    ) : displayTab === "github" && student.github ? (
                      <>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.github.stats?.publicRepos ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.github.stats?.totalStars ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.github.stats?.followers ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.github.stats?.contributions ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono'] text-white">{student.scores?.github ?? 0}</td>
                      </>
                    ) : displayTab === "leetcode" && student.leetcode ? (
                      <>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.leetcode.stats?.easySolved ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.leetcode.stats?.mediumSolved ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.leetcode.stats?.hardSolved ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.leetcode.stats?.totalSolved ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.leetcode.stats?.contestRating ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono'] text-white">{student.scores?.leetcode ?? 0}</td>
                      </>
                    ) : displayTab === "codeforces" && student.codeforces ? (
                      <>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.codeforces.stats?.rating ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.codeforces.stats?.maxRating ?? 0}</td>
                        <td className="px-4 py-3">{student.codeforces.stats?.rank ?? "—"}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.codeforces.stats?.problemsSolved ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono'] text-white">{student.scores?.codeforces ?? 0}</td>
                      </>
                    ) : displayTab === "codechef" && student.codechef ? (
                      <>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.codechef.stats?.currentRating ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.codechef.stats?.highestRating ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.codechef.stats?.stars ?? 0}★</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono']">{student.codechef.stats?.totalProblemsSolved ?? 0}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono'] text-white">{student.scores?.codechef ?? 0}</td>
                      </>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Search result CTA */}
      {searchQuery && students.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 rounded border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="text-sm text-[#888888]">
            Found yourself? Your profile might be incomplete.
          </span>
          <Link
            to="/register"
            className="flex items-center gap-2 text-sm text-white transition-opacity hover:opacity-80"
          >
            Complete Profile →
          </Link>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-1" />
      {loadingMore && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[#888888]" />
          <span className="ml-2 font-['Archivo'] text-sm text-[#888888]">Loading more...</span>
        </div>
      )}
      {!loadingMore && students.length > 0 && currentPage >= totalPages && (
        <div className="py-6 text-center font-['Archivo'] text-xs text-[#666666]">
          Showing all {totalCount} students
        </div>
      )}
    </div>
  );
}
