const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.error || body.message || res.statusText);
    err.status = res.status;
    err.errors = body.errors; // validation errors array
    throw err;
  }
  return res.json();
}

// ---- Leaderboard ----

export interface LeaderboardQuery {
  year?: number | string;
  branch?: string;
  search?: string;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export async function fetchLeaderboard(params: LeaderboardQuery = {}) {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.branch) qs.set("branch", params.branch);
  if (params.search) qs.set("search", params.search);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.order) qs.set("order", params.order);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return request<{ students: any[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
    `/leaderboard?${qs}`
  );
}

export async function fetchPlatformLeaderboard(platform: string, params: LeaderboardQuery = {}) {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.branch) qs.set("branch", params.branch);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return request<{ students: any[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
    `/leaderboard/${platform}?${qs}`
  );
}

export async function fetchTopGainers(limit = 10) {
  return request<{
    gainers: Array<{
      rollno: string;
      name: string;
      branch: string;
      year: number;
      gain: number;
      currentScore: number;
      previousScore: number;
    }>;
    period: { from: string; to: string };
  }>(`/leaderboard/top-gainers?limit=${limit}`);
}

export async function fetchFilters() {
  return request<{
    years: number[];
    branches: string[];
    platforms: Array<{
      key: string;
      label: string;
      headers: Array<{ label: string; statKey: string }>;
      profileStats: Array<{ label: string; statKey: string }>;
      profileUrl: string | null;
    }>;
  }>("/leaderboard/filters");
}

// ---- Students ----

export async function searchStudents(q: string) {
  return request<{
    results: Array<{
      rollno: string;
      name: string;
      branch: string;
      year: number;
      exists: boolean;
    }>;
  }>(`/students/search?q=${encodeURIComponent(q)}`);
}

export async function validatePlatformUsername(platform: string, username: string) {
  return request<{ valid: boolean; stats?: Record<string, any> }>(
    `/students/validate-username/${encodeURIComponent(platform)}/${encodeURIComponent(username)}`
  );
}

export async function lookupStudent(rollno: string) {
  return request<{
    exists: boolean;
    student: {
      rollno: string;
      name: string;
      branch: string;
      branchFull?: string;
      year: number | null;
      github?: string;
      leetcode?: string;
      codeforces?: string;
      codechef?: string;
    };
  }>(`/students/lookup/${encodeURIComponent(rollno)}`);
}

export async function registerStudent(data: {
  rollno: string;
  name: string;
  branch: string;
  year: string | number;
  github?: string;
  leetcode?: string;
  codeforces?: string;
  codechef?: string;
}) {
  return request<{ message: string; student: any }>("/students/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchStudent(rollno: string) {
  return request<any>(`/students/${encodeURIComponent(rollno)}`);
}

export async function updateUsernames(
  rollno: string,
  usernames: { github?: string; leetcode?: string; codeforces?: string; codechef?: string }
) {
  return request<{ message: string; student: any }>(`/students/${encodeURIComponent(rollno)}/usernames`, {
    method: "PUT",
    body: JSON.stringify(usernames),
  });
}

export async function restoreUsernames(rollno: string, index: number) {
  return request<{ message: string; student: any }>(`/students/${encodeURIComponent(rollno)}/restore`, {
    method: "POST",
    body: JSON.stringify({ index }),
  });
}

export async function fetchStudentHistory(rollno: string, days = 30) {
  return request<{
    rollno: string;
    snapshots: Array<{
      date: string;
      scores: { github: number; leetcode: number; codeforces: number; codechef: number; total: number };
    }>;
  }>(`/students/${encodeURIComponent(rollno)}/history?days=${days}`);
}

export async function fetchBranches() {
  return request<any>("/students/branches");
}
