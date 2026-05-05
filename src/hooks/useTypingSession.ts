import { useEffect, useMemo, useRef, useState } from "react";

import {
  getContentByCategory,
  getDailyChallenge,
  getMixedPracticeSet,
} from "../content/contentLibrary";
import type {
  ContentItem,
  PersistedSession,
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
import type { AchievementState } from "../progress/achievementRules";
import {
  fetchProgressSnapshot,
  isUnauthorizedProgressError,
  saveCompletedSession,
} from "../progress/progressApi";
import {
  mapAchievementSnapshot,
  mapSessionSnapshot,
} from "../progress/progressMappers";
import { calculateSessionResult } from "../scoring/sessionScoring";

interface UseTypingSessionValue {
  mode: PracticeMode;
  setMode: (mode: PracticeMode) => void;
  focusedCategory: PracticeCategory;
  setFocusedCategory: (category: PracticeCategory) => void;
  content: ContentItem | null;
  sessionState: TypingSessionState;
  result: SessionResult | null;
  sessions: PersistedSession[];
  achievements: AchievementState[];
  dailyChallenge: StoredDailyChallenge | null;
  progressError: string | null;
  startSession: () => void;
  inputCharacter: (char: string) => void;
  backspace: () => void;
  nextSession: () => void;
}

interface UseTypingSessionOptions {
  onAuthExpired: () => void;
}

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function shuffleContent(items: ContentItem[]): ContentItem[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function getQueueForMode(
  mode: PracticeMode,
  focusedCategory: PracticeCategory,
  dateKey: string,
): ContentItem[] {
  if (mode === "focused") {
    return shuffleContent(getContentByCategory(focusedCategory));
  }

  if (mode === "daily") {
    return [getDailyChallenge(dateKey).content];
  }

  return shuffleContent(getMixedPracticeSet(6));
}

export function useTypingSession({
  onAuthExpired,
}: UseTypingSessionOptions): UseTypingSessionValue {
  const [mode, setMode] = useState<PracticeMode>("mixed");
  const [focusedCategory, setFocusedCategory] =
    useState<PracticeCategory>("code");
  const [promptQueue, setPromptQueue] = useState<ContentItem[]>(() =>
    getQueueForMode("mixed", "code", getDateKey()),
  );
  const [queueIndex, setQueueIndex] = useState(0);
  const [sessionState, setSessionState] = useState<TypingSessionState>(() =>
    createSessionState(""),
  );
  const [sessions, setSessions] = useState<PersistedSession[]>([]);
  const [achievements, setAchievements] = useState<AchievementState[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<StoredDailyChallenge | null>(
    null,
  );
  const [latestResult, setLatestResult] = useState<SessionResult | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const savedResultKey = useRef<string | null>(null);

  const content = useMemo(
    () => promptQueue[queueIndex] ?? null,
    [promptQueue, queueIndex],
  );

  const completedResult = useMemo(() => {
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
    let cancelled = false;

    fetchProgressSnapshot()
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        setSessions(mapSessionSnapshot(snapshot.sessions));
        setAchievements(mapAchievementSnapshot(snapshot.achievements));
        setDailyChallenge(snapshot.dailyChallenge);
        setProgressError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (isUnauthorizedProgressError(error)) {
          onAuthExpired();
          return;
        }

        setProgressError(
          error instanceof Error ? error.message : "Progress bootstrap failed",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [onAuthExpired]);

  useEffect(() => {
    const nextQueue = getQueueForMode(mode, focusedCategory, getDateKey());
    setPromptQueue(nextQueue);
    setQueueIndex(0);
    setSessionState(createSessionState(""));
    setLatestResult(null);
    savedResultKey.current = null;
  }, [mode, focusedCategory]);

  useEffect(() => {
    if (!completedResult || !content || !sessionState.completedAt) {
      return;
    }

    const resultKey = `${content.id}:${sessionState.completedAt}`;
    if (savedResultKey.current === resultKey) {
      return;
    }
    savedResultKey.current = resultKey;
    setLatestResult(completedResult);

    saveCompletedSession(completedResult)
      .then((snapshot) => {
        setSessions(mapSessionSnapshot(snapshot.sessions));
        setAchievements(mapAchievementSnapshot(snapshot.achievements));
        setDailyChallenge(snapshot.dailyChallenge);
        setProgressError(null);
      })
      .catch((error) => {
        if (isUnauthorizedProgressError(error)) {
          onAuthExpired();
          return;
        }

        setProgressError(
          error instanceof Error ? error.message : "Session sync failed",
        );
      });

    const nextIndex = queueIndex + 1;
    const nextQueue =
      nextIndex >= promptQueue.length
        ? getQueueForMode(mode, focusedCategory, getDateKey())
        : promptQueue;
    const normalizedIndex = nextIndex >= promptQueue.length ? 0 : nextIndex;
    const nextContent = nextQueue[normalizedIndex] ?? null;

    if (nextContent) {
      if (nextQueue !== promptQueue) {
        setPromptQueue(nextQueue);
      }
      setQueueIndex(normalizedIndex);
      setSessionState(createSessionState(nextContent.prompt));
    }
  }, [
    completedResult,
    content,
    focusedCategory,
    mode,
    onAuthExpired,
    promptQueue,
    queueIndex,
    sessionState.completedAt,
  ]);

  function startSession() {
    if (!content) {
      return;
    }

    savedResultKey.current = null;
    setLatestResult(null);
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
    const nextIndex = queueIndex + 1;
    const nextQueue =
      nextIndex >= promptQueue.length
        ? getQueueForMode(mode, focusedCategory, getDateKey())
        : promptQueue;
    const normalizedIndex = nextIndex >= promptQueue.length ? 0 : nextIndex;
    const nextContent = nextQueue[normalizedIndex] ?? null;
    setLatestResult(null);

    if (nextContent) {
      if (nextQueue !== promptQueue) {
        setPromptQueue(nextQueue);
      }
      setQueueIndex(normalizedIndex);
      setSessionState(createSessionState(nextContent.prompt));
    }
  }

  return {
    mode,
    setMode,
    focusedCategory,
    setFocusedCategory,
    content,
    sessionState,
    result: latestResult,
    sessions,
    achievements,
    dailyChallenge,
    progressError,
    startSession,
    inputCharacter,
    backspace,
    nextSession,
  };
}
