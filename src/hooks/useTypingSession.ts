import { useEffect, useMemo, useRef, useState } from "react";

import {
  fetchBackendDailyChallenge,
  fetchSessionContent,
} from "../content/contentApi";
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

export function useTypingSession({
  onAuthExpired,
}: UseTypingSessionOptions): UseTypingSessionValue {
  const [mode, setMode] = useState<PracticeMode>("mixed");
  const [focusedCategory, setFocusedCategory] =
    useState<PracticeCategory>("code");
  const [promptQueue, setPromptQueue] = useState<ContentItem[]>([]);
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
    if (mode === "daily") {
      return;
    }

    let cancelled = false;

    setPromptQueue([]);
    setQueueIndex(0);
    setSessionState(createSessionState(""));
    setLatestResult(null);
    savedResultKey.current = null;

    fetchSessionContent(
      mode === "focused" ? "focused" : "mixed",
      mode === "focused" ? focusedCategory : undefined,
    )
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setPromptQueue(payload.items);
        setQueueIndex(0);
        setSessionState(createSessionState(""));
        setLatestResult(null);
        savedResultKey.current = null;
        setProgressError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "AUTH_EXPIRED") {
          onAuthExpired();
          return;
        }

        setPromptQueue([]);
        setQueueIndex(0);
        setSessionState(createSessionState(""));
        setProgressError(
          error instanceof Error ? error.message : "Content queue fetch failed",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [focusedCategory, mode, onAuthExpired]);

  useEffect(() => {
    if (mode !== "daily") {
      return;
    }

    let cancelled = false;

    setPromptQueue([]);
    setQueueIndex(0);
    setSessionState(createSessionState(""));
    setLatestResult(null);
    savedResultKey.current = null;

    fetchBackendDailyChallenge()
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setPromptQueue([payload.content]);
        setQueueIndex(0);
        setSessionState(createSessionState(""));
        setDailyChallenge((currentChallenge) => ({
          dateKey: payload.dateKey,
          challengeId: payload.content.id,
          completed: currentChallenge?.completed ?? false,
          bestWpm: currentChallenge?.bestWpm ?? 0,
          bestAccuracy: currentChallenge?.bestAccuracy ?? 0,
        }));
        setProgressError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "AUTH_EXPIRED") {
          onAuthExpired();
          return;
        }

        setPromptQueue([]);
        setQueueIndex(0);
        setSessionState(createSessionState(""));
        setProgressError(
          error instanceof Error
            ? error.message
            : "Daily challenge fetch failed",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [mode, onAuthExpired]);

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

    if (nextIndex < promptQueue.length) {
      const nextContent = promptQueue[nextIndex] ?? null;
      if (nextContent) {
        setQueueIndex(nextIndex);
        setSessionState(createSessionState(nextContent.prompt));
      }
      return;
    }

    if (mode === "daily") {
      void fetchBackendDailyChallenge()
        .then((payload) => {
          setPromptQueue([payload.content]);
          setQueueIndex(0);
          setSessionState(createSessionState(payload.content.prompt));
        })
        .catch((error) => {
          if (error instanceof Error && error.message === "AUTH_EXPIRED") {
            onAuthExpired();
            return;
          }

          setPromptQueue([]);
          setQueueIndex(0);
          setSessionState(createSessionState(""));
          setProgressError(
            error instanceof Error
              ? error.message
              : "Daily challenge fetch failed",
          );
        });
      return;
    }

    void fetchSessionContent(
      mode === "focused" ? "focused" : "mixed",
      mode === "focused" ? focusedCategory : undefined,
    )
      .then((payload) => {
        setPromptQueue(payload.items);
        setQueueIndex(0);
        if (payload.items[0]) {
          setSessionState(createSessionState(payload.items[0].prompt));
        } else {
          setSessionState(createSessionState(""));
        }
        setProgressError(null);
      })
      .catch((error) => {
        if (error instanceof Error && error.message === "AUTH_EXPIRED") {
          onAuthExpired();
          return;
        }

        setPromptQueue([]);
        setQueueIndex(0);
        setSessionState(createSessionState(""));
        setProgressError(
          error instanceof Error ? error.message : "Content queue fetch failed",
        );
      });
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
    setLatestResult(null);
    const nextIndex = queueIndex + 1;

    if (nextIndex < promptQueue.length) {
      const nextContent = promptQueue[nextIndex] ?? null;
      if (nextContent) {
        setQueueIndex(nextIndex);
        setSessionState(createSessionState(nextContent.prompt));
      }
      return;
    }

    if (mode === "daily") {
      void fetchBackendDailyChallenge()
        .then((payload) => {
          setPromptQueue([payload.content]);
          setQueueIndex(0);
          setSessionState(createSessionState(payload.content.prompt));
          setProgressError(null);
        })
        .catch((error) => {
          if (error instanceof Error && error.message === "AUTH_EXPIRED") {
            onAuthExpired();
            return;
          }

          setPromptQueue([]);
          setQueueIndex(0);
          setSessionState(createSessionState(""));
          setProgressError(
            error instanceof Error
              ? error.message
              : "Daily challenge fetch failed",
          );
        });
      return;
    }

    void fetchSessionContent(
      mode === "focused" ? "focused" : "mixed",
      mode === "focused" ? focusedCategory : undefined,
    )
      .then((payload) => {
        setPromptQueue(payload.items);
        setQueueIndex(0);
        if (payload.items[0]) {
          setSessionState(createSessionState(payload.items[0].prompt));
        } else {
          setSessionState(createSessionState(""));
        }
        setProgressError(null);
      })
      .catch((error) => {
        if (error instanceof Error && error.message === "AUTH_EXPIRED") {
          onAuthExpired();
          return;
        }

        setPromptQueue([]);
        setQueueIndex(0);
        setSessionState(createSessionState(""));
        setProgressError(
          error instanceof Error ? error.message : "Content queue fetch failed",
        );
      });
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
