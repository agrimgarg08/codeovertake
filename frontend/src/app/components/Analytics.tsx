import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Activity, BarChart3, Link2, Trophy, TrendingUp } from "lucide-react";
import { BarChart, Bar, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { fetchAnalyticsOverview, type AnalyticsOverview } from "../api";

const platformColors: Record<string, string> = {
  github: "#4ade80",
  leetcode: "#f59e0b",
  codeforces: "#60a5fa",
  codechef: "#a78bfa",
};

const pieColors = ["#4ade80", "#22c55e", "#16a34a", "#15803d", "#14532d", "#84cc16"];

export function Analytics() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchAnalyticsOverview()
      .then((res) => setData(res))
      .catch(() => setError("Could not load analytics right now."))
      .finally(() => setLoading(false));
  }, []);

  const trendData = useMemo(() => data?.trend || [], [data]);
  const coverageData = useMemo(() => data?.platformCoverage || [], [data]);
  const branchData = useMemo(() => data?.branchDistribution || [], [data]);
  const scoreRanges = useMemo(() => data?.scoreDistribution || [], [data]);
  const yearData = useMemo(() => data?.yearDistribution || [], [data]);
  const registrationData = useMemo(() => data?.registrationsTrend || [], [data]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-3 py-10 text-center text-[#888888]">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="mx-auto max-w-7xl px-3 py-10 text-center text-[#888888]">{error || "Analytics unavailable."}</div>;
  }

  const cards = [
    {
      title: "Total Students",
      value: data.summary.totalStudents.toLocaleString(),
      subtitle: "profiles in database",
      icon: <BarChart3 className="h-4 w-4 text-[#4ade80]" />,
    },
    {
      title: "Linked Profiles",
      value: `${data.summary.linkedStudents.toLocaleString()} (${data.summary.linkedPercentage}%)`,
      subtitle: "with at least one platform",
      icon: <Link2 className="h-4 w-4 text-[#4ade80]" />,
    },
    {
      title: "Average Score",
      value: data.summary.averageTotalScore.toLocaleString(),
      subtitle: data.summary.latestSnapshotDate ? `latest snapshot: ${data.summary.latestSnapshotDate}` : "current average",
      icon: <Activity className="h-4 w-4 text-[#4ade80]" />,
    },
    {
      title: "Snapshot Momentum",
      value: `${data.summary.averageDeltaFromPreviousSnapshot >= 0 ? "+" : ""}${data.summary.averageDeltaFromPreviousSnapshot}`,
      subtitle: "avg total vs previous snapshot",
      icon: <TrendingUp className="h-4 w-4 text-[#4ade80]" />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <h1 className="mb-6 font-['JetBrains_Mono'] text-2xl tracking-tight sm:mb-8 sm:text-3xl">Analytics</h1>

      <div className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-['JetBrains_Mono'] text-xs uppercase tracking-wider text-[#888888]">{card.title}</div>
              {card.icon}
            </div>
            <div className="font-['JetBrains_Mono'] text-xl">{card.value}</div>
            <div className="mt-1 text-xs text-[#666666]">{card.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Score Trend (Snapshots)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#888888", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f0f", border: "1px solid #1e1e1e", color: "#fff" }} />
                <Legend />
                <Line type="monotone" dataKey="avgTotal" stroke="#4ade80" strokeWidth={2} dot={false} name="Average Total" />
                <Line type="monotone" dataKey="maxTotal" stroke="#8884d8" strokeWidth={2} dot={false} name="Top Total" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Platform Coverage</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverageData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="platform" tick={{ fill: "#888888", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f0f", border: "1px solid #1e1e1e", color: "#fff" }} />
                <Bar dataKey="linkedCount" radius={[6, 6, 0, 0]}>
                  {coverageData.map((entry) => (
                    <Cell key={entry.platform} fill={platformColors[entry.platform]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Branch Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={branchData} dataKey="count" nameKey="branch" outerRadius={96} label>
                  {branchData.map((_, index) => (
                    <Cell key={index} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f0f0f", border: "1px solid #1e1e1e", color: "#fff" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Score Range Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreRanges}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fill: "#888888", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f0f", border: "1px solid #1e1e1e", color: "#fff" }} />
                <Bar dataKey="count" fill="#4ade80" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Year-Wise Participation</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fill: "#888888", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f0f", border: "1px solid #1e1e1e", color: "#fff" }} />
                <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
          <h2 className="mb-4 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">Registrations (Last 30 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={registrationData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#888888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888888", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f0f", border: "1px solid #1e1e1e", color: "#fff" }} />
                <Line type="monotone" dataKey="count" stroke="#4ade80" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded border border-[#1e1e1e] bg-[#111111] p-4">
        <h2 className="mb-4 flex items-center gap-2 font-['JetBrains_Mono'] text-sm uppercase tracking-wider text-[#888888]">
          <Trophy className="h-4 w-4 text-[#4ade80]" />
          Top Students
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {data.topStudents.map((student) => (
            <Link
              key={student.rollno}
              to={`/student/${student.rollno}`}
              className="rounded border border-[#1e1e1e] bg-[#0f0f0f] p-3 transition-colors hover:border-[#333333]"
            >
              <div className="mb-1 truncate text-sm">{student.name}</div>
              <div className="font-['JetBrains_Mono'] text-xs text-[#666666]">{student.rollno}</div>
              <div className="mt-2 font-['JetBrains_Mono'] text-[#4ade80]">{student.totalScore}</div>
              <div className="text-xs text-[#888888]">Rank #{student.overallRank ?? "N/A"}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
