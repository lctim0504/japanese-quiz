import type { QuizItem } from "@/types/quiz";

export function createWordItems(prefix: string, entries: [string, string][]) {
  return entries.map(([reading, kana], index) => ({
    id: `${prefix}-${index + 1}`,
    reading,
    kana,
  }));
}

const DATE_READINGS = [
  { day: 1, reading: "一日", kana: "ついたち" },
  { day: 2, reading: "二日", kana: "ふつか" },
  { day: 3, reading: "三日", kana: "みっか" },
  { day: 4, reading: "四日", kana: "よっか" },
  { day: 5, reading: "五日", kana: "いつか" },
  { day: 6, reading: "六日", kana: "むいか" },
  { day: 7, reading: "七日", kana: "なのか" },
  { day: 8, reading: "八日", kana: "ようか" },
  { day: 9, reading: "九日", kana: "ここのか" },
  { day: 10, reading: "十日", kana: "とおか" },
  { day: 11, reading: "十一日", kana: "じゅういちにち" },
  { day: 12, reading: "十二日", kana: "じゅうににち" },
  { day: 13, reading: "十三日", kana: "じゅうさんにち" },
  { day: 14, reading: "十四日", kana: "じゅうよっか" },
  { day: 15, reading: "十五日", kana: "じゅうごにち" },
  { day: 16, reading: "十六日", kana: "じゅうろくにち" },
  { day: 17, reading: "十七日", kana: "じゅうしちにち" },
  { day: 18, reading: "十八日", kana: "じゅうはちにち" },
  { day: 19, reading: "十九日", kana: "じゅうくにち" },
  { day: 20, reading: "二十日", kana: "はつか" },
  { day: 21, reading: "二十一日", kana: "にじゅういちにち" },
  { day: 22, reading: "二十二日", kana: "にじゅうににち" },
  { day: 23, reading: "二十三日", kana: "にじゅうさんにち" },
  { day: 24, reading: "二十四日", kana: "にじゅうよっか" },
  { day: 25, reading: "二十五日", kana: "にじゅうごにち" },
  { day: 26, reading: "二十六日", kana: "にじゅうろくにち" },
  { day: 27, reading: "二十七日", kana: "にじゅうしちにち" },
  { day: 28, reading: "二十八日", kana: "にじゅうはちにち" },
  { day: 29, reading: "二十九日", kana: "にじゅうくにち" },
  { day: 30, reading: "三十日", kana: "さんじゅうにち" },
  { day: 31, reading: "三十一日", kana: "さんじゅういちにち" },
];

export const DATE_QUIZ_ITEMS: QuizItem[] = DATE_READINGS.map((item) => ({
  id: `date-${item.day}`,
  reading: item.reading,
  kana: item.kana,
}));
