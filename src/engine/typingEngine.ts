export interface TypingSessionState {
  target: string;
  cursor: number;
  correctChars: number;
  errorCount: number;
  invalid: string | null;
  startedAt: number | null;
  completedAt: number | null;
}

export function createSessionState(target: string): TypingSessionState {
  return {
    target,
    cursor: 0,
    correctChars: 0,
    errorCount: 0,
    invalid: null,
    startedAt: null,
    completedAt: null,
  };
}

export function handleCharacterInput(
  state: TypingSessionState,
  input: string,
  timestamp: number,
): TypingSessionState {
  const startedAt = state.startedAt ?? timestamp;
  const expected = state.target[state.cursor];

  if (!expected) {
    return state;
  }

  if (state.invalid) {
    return {
      ...state,
      startedAt,
      invalid: input,
      errorCount: state.errorCount + 1,
    };
  }

  if (input !== expected) {
    return {
      ...state,
      startedAt,
      invalid: input,
      errorCount: state.errorCount + 1,
    };
  }

  const cursor = state.cursor + 1;
  const completedAt = cursor === state.target.length ? timestamp : null;

  return {
    ...state,
    startedAt,
    cursor,
    invalid: null,
    correctChars: state.correctChars + 1,
    completedAt,
  };
}

export function handleBackspace(state: TypingSessionState): TypingSessionState {
  if (state.invalid) {
    return {
      ...state,
      invalid: null,
    };
  }

  if (state.cursor === 0) {
    return state;
  }

  return {
    ...state,
    cursor: state.cursor - 1,
    correctChars: Math.max(0, state.correctChars - 1),
    completedAt: null,
  };
}
