import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import {
  getMongoClient,
  isMongoConfigured,
  SCORES_COLLECTION,
} from "@/lib/mongodb";

type ScoreDocument = {
  _id?: ObjectId;
  nickname: string;
  score: number;
  quizSetId: string;
  quizSetLabel: string;
  createdAt: Date;
};

function sanitizeNickname(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const nickname = value.trim();

  if (nickname.length < 1 || nickname.length > 12) {
    return null;
  }

  return nickname;
}

function sanitizeScore(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const score = Math.round(value);

  if (score < 0 || score > 10000) {
    return null;
  }

  return score;
}

function sanitizeQuizSetId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const quizSetId = value.trim();

  if (quizSetId.length < 1 || quizSetId.length > 80) {
    return null;
  }

  return quizSetId;
}

export async function GET(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ entries: [], configured: false });
  }

  const { searchParams } = new URL(request.url);
  const quizSetId = sanitizeQuizSetId(searchParams.get("quizSetId"));
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? 10), 1),
    20,
  );

  if (!quizSetId) {
    return NextResponse.json({ error: "Invalid quiz set id" }, { status: 400 });
  }

  try {
    const client = await getMongoClient();
    const collection = client.db().collection<ScoreDocument>(SCORES_COLLECTION);
    const entries = await collection
      .find({ quizSetId })
      .sort({ score: -1, createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      configured: true,
      entries: entries.map((entry) => ({
        id: String(entry._id),
        nickname: entry.nickname,
        score: entry.score,
        quizSetId: entry.quizSetId,
        quizSetLabel: entry.quizSetLabel,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "排行榜尚未設定資料庫" },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const nickname = sanitizeNickname(payload.nickname);
  const score = sanitizeScore(payload.score);
  const quizSetId = sanitizeQuizSetId(payload.quizSetId);
  const quizSetLabel =
    typeof payload.quizSetLabel === "string"
      ? payload.quizSetLabel.trim().slice(0, 80)
      : "";

  if (!nickname || score === null || !quizSetId || !quizSetLabel) {
    return NextResponse.json({ error: "資料格式不正確" }, { status: 400 });
  }

  const document: ScoreDocument = {
    nickname,
    score,
    quizSetId,
    quizSetLabel,
    createdAt: new Date(),
  };

  try {
    const client = await getMongoClient();
    const collection = client.db().collection<ScoreDocument>(SCORES_COLLECTION);
    const result = await collection.insertOne(document);

    return NextResponse.json({
      ok: true,
      entry: {
        id: String(result.insertedId),
        nickname: document.nickname,
        score: document.score,
        quizSetId: document.quizSetId,
        quizSetLabel: document.quizSetLabel,
        createdAt: document.createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "上傳分數失敗" }, { status: 500 });
  }
}
