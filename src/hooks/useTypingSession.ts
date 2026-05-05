import { useEffect, useMemo, useRef, useState } from "react";

import {
  getContentByCategory,
  getDailyChallenge,
  getMixedPracticeSet,
} from "../content/contentLibrary";
import type {
  ContentItem,
  PracticeCategory,
  PracticeMode,
  SessionResult,
  StoredDailyChallenge,
} from "../domain/types";
import {
  createSessionState,
  handleBackspace,
  handleCharacterInput,
} from "../engine/typingEngine";
import type { TypingSessionState } from "../engine/typingEngine";
import {
  evaluateAchievements,
  type AchievementState,
} from "../progress/achievementRules";
import { createProgressRepository } from "../progress/storage";
import { calculateSessionResult } from "../scoring/sessionScoring";

const repository = createProgressRepository(window.localStorage);

interface UseTypingSessionValue {
  mode: PracticeMode;
  setMode: (mode: PracticeMode) => void;
  focusedCategory: PracticeCategory;
  setFocusedCategory: (category: PracticeCategory) => void;
  content: ContentItem | null;
  sessionState: TypingSessionState;
  result: SessionResult | null;
  sessions: SessionResult[];
  achievements: AchievementState[];
  dailyChallenge: StoredDailyChallenge | null;
  startSession: () => void;
  inputCharacter: (char: string) => void;
  backspace: () => void;
  nextSession: () => void;
}

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useTypingSession(): UseTypingSessionValue {
  const [mode, setMode] = useState<PracticeMode>("mixed");
  const [focusedCategory, setFocusedCategory] =
    useState<PracticeCategory>("code");
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionState, setSessionState] = useState<TypingSessionState>(() =>
    createSessionState(""),
  );
  const [sessions, setSessions] = useState<SessionResult[]>(() =>
    repository.getSessions(),
  );
  const [achievements, setAchievements] = useState<AchievementState[]>(() =>
    repository.getAchievements(),
  );
  const [dailyChallenge, setDailyChallenge] = useState<StoredDailyChallenge | null>(
    () => repository.getDailyChallenge(getDateKey()),
  );
  const savedResultKey = useRef<string | null>(null);

  const content = useMemo(() => {
    if (mode === "focused") {
      return getContentByCategory(focusedCategory)[0] ?? null;
    }

    if (mode === "daily") {
      return getDailyChallenge(getDateKey()).content;
    }

    const mixed = getMixedPracticeSet(6);
    return mixed[sessionIndex % mixed.length] ?? null;
  }, [focusedCategory, mode, sessionIndex]);

  const result = useMemo(() => {
    if (!content || !sessionState.startedAt || !sessionState.completedAt) {
      return null;
    }

    return calculateSessionResult({
      mode,
      category: mode === "mixed" ? "mixed" : content.category,
      startedAt: sessionState.startedAt,
      completedAt: sessionState.completedAt,
      totalChars: content.prompt.length,
      correctChars: sessionState.correctChars,
      errorCount: sessionState.errorCount,
      valid: true,
    });
  }, [content, mode, sessionState]);

  useEffect(() => {
    setSessionState(createSessionState(""));
    savedResultKey.current = null;
  }, [content?.id, mode]);

  useEffect(() => {
    if (!result || !content || !sessionState.completedAt) {
      return;
    }

    const resultKey = `${content.id}:${sessionState.completedAt}`;
    if (savedResultKey.current === resultKey) {
      return;
    }
    savedResultKey.current = resultKey;

    repository.saveSession(result);
    setSessions(repository.getSessions());

    const nextAchievements = evaluateAchievements(repository.getAchievements(), result);
    repository.saveAchievements(nextAchievements);
    setAchievements(nextAchievements);

    if (mode === "daily") {
      const nextDailyChallenge: StoredDailyChallenge = {
        dateKey: getDateKey(),
        challengeId: content.id,
        completed: true,
        bestWpm: Math.max(dailyChallenge?.bestWpm ?? 0, result.wpm),
        bestAccuracy: Math.max(dailyChallenge?.bestAccuracy ?? 0, result.accuracy),
      };
      repository.saveDailyChallenge(nextDailyChallenge);
      setDailyChallenge(nextDailyChallenge);
    }
  }, [content, dailyChallenge, mode, result, sessionState.completedAt]);

  function startSession() {
    if (!content) {
      return;
    }

    savedResultKey.current = null;
    setSessionState(createSessionState(content.prompt));
  }

  function inputCharacter(char: string) {
    setSessionState((current) => handleCharacterInput(current, char, Date.now()));
  }

  function backspace() {
    setSessionState((current) => handleBackspace(current));
  }

  function nextSession() {
    savedResultKey.current = null;
    setSessionIndex((value) => value + 1);
    setDailyChallenge(repository.getDailyChallenge(getDateKey()));
  }

  return {
    mode,
    setMode,
    focusedCategory,
    setFocusedCategory,
    content,
    sessionState,
    result,
    sessions,
    achievements,
    dailyChallenge,
    startSession,
    inputCharacter,
    backspace,
    nextSession,
  };
}
