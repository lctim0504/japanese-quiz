import type { LeaderboardEntry, LeaderboardResponse } from "@/types/leaderboard";

const NICKNAME_STORAGE_KEY = "japanese-reading-quiz-nickname";

export function getStoredNickname() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(NICKNAME_STORAGE_KEY) ?? "";
}

export function saveStoredNickname(nickname: string) {
  window.localStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
}

export async function fetchLeaderboard(
  quizSetId: string,
  limit = 10,
): Promise<LeaderboardResponse> {
  const response = await fetch(
    `/api/scores?quizSetId=${encodeURIComponent(quizSetId)}&limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error("無法讀取排行榜");
  }

  return response.json() as Promise<LeaderboardResponse>;
}

export async function submitLeaderboardScore(input: {
  nickname: string;
  score: number;
  quizSetId: string;
  quizSetLabel: string;
}) {
  const response = await fetch("/api/scores", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    entry?: LeaderboardEntry;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "上傳失敗");
  }

  return data.entry;
}
