"use client";

import { useEffect, useState } from "react";

import { fetchLeaderboard } from "@/lib/leaderboard";
import type { LeaderboardEntry } from "@/types/leaderboard";

type LeaderboardPanelProps = {
  quizSetId: string;
  refreshToken?: number;
  compact?: boolean;
};

export function LeaderboardPanel({
  quizSetId,
  refreshToken = 0,
  compact = false,
}: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [configured, setConfigured] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadLeaderboard() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await fetchLeaderboard(quizSetId);

        if (!isCancelled) {
          setEntries(data.entries);
          setConfigured(data.configured);
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("排行榜讀取失敗");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLeaderboard();

    return () => {
      isCancelled = true;
    };
  }, [quizSetId, refreshToken]);

  return (
    <div
      className={`rounded-3xl border border-stone-200 bg-white/90 ${
        compact ? "p-4" : "p-5 shadow-lg shadow-stone-300/20 sm:p-6"
      }`}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-rose-500">全站排行榜</p>
          <h3 className="mt-1 text-lg font-black text-stone-900">
            本題庫前 10 名
          </h3>
        </div>
        {!configured && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-500">
            尚未連線
          </span>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-stone-500">讀取中...</p>
        ) : errorMessage ? (
          <p className="text-sm text-red-500">{errorMessage}</p>
        ) : !configured ? (
          <p className="text-sm leading-6 text-stone-500">
            請在 Vercel 設定 `MONGODB_URI` 後，排行榜才會開始記錄。
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-stone-500">還沒有人上傳分數，來當第一名的吧。</p>
        ) : (
          <div className="grid gap-2">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span className="font-bold text-stone-900">{entry.nickname}</span>
                </span>
                <span className="font-black text-rose-500">{entry.score} 分</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
