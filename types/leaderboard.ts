export type LeaderboardEntry = {
  id: string;
  nickname: string;
  score: number;
  quizSetId: string;
  quizSetLabel: string;
  createdAt: string;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  configured: boolean;
};
