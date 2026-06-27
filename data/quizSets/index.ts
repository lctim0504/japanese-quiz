import { ADJECTIVE_QUIZ_SETS } from "./adjectives";
import { ADVERB_QUIZ_SETS } from "./adverbs";
import { CONNECTOR_QUIZ_SETS } from "./connectors";
import { COUNTER_QUIZ_SETS } from "./counters";
import { INTERJECTION_QUIZ_SETS } from "./interjections";
import { JLPT_QUIZ_SETS } from "./jlpt";
import { LOANWORD_QUIZ_SETS } from "./loanwords";
import { NOUN_QUIZ_SETS } from "./nouns";
import { NOUN_SCENARIO_QUIZ_SETS } from "./nounScenarios";
import { OTHER_QUIZ_SETS } from "./other";
import { PRONOUN_QUIZ_SETS } from "./pronouns";
import { VERB_QUIZ_SETS } from "./verbs";

export const QUIZ_SETS = [
  ...JLPT_QUIZ_SETS,
  ...NOUN_QUIZ_SETS,
  ...NOUN_SCENARIO_QUIZ_SETS,
  ...VERB_QUIZ_SETS,
  ...ADJECTIVE_QUIZ_SETS,
  ...ADVERB_QUIZ_SETS,
  ...LOANWORD_QUIZ_SETS,
  ...CONNECTOR_QUIZ_SETS,
  ...PRONOUN_QUIZ_SETS,
  ...COUNTER_QUIZ_SETS,
  ...INTERJECTION_QUIZ_SETS,
  ...OTHER_QUIZ_SETS,
];

export const JLPT_MENU_SETS = JLPT_QUIZ_SETS;

const CATEGORY_GROUPS = [
  { id: "noun-number", label: "名詞(數字)" },
  { id: "noun", label: "名詞" },
  { id: "verb", label: "動詞" },
  { id: "adjective", label: "形容詞" },
  { id: "adverb", label: "副詞" },
  { id: "loanword", label: "外來語" },
  { id: "connector", label: "接續詞" },
  { id: "pronoun", label: "代名詞" },
  { id: "counter", label: "助數詞" },
  { id: "interjection", label: "感嘆詞" },
  { id: "other", label: "其他" },
] as const;

export const CATEGORY_MENU_GROUPS = CATEGORY_GROUPS.map((categoryGroup) => ({
  ...categoryGroup,
  quizSets: QUIZ_SETS.filter(
    (quizSet) =>
      quizSet.group === "category" &&
      quizSet.categoryGroup === categoryGroup.id,
  ),
})).filter((categoryGroup) => categoryGroup.quizSets.length > 0);
