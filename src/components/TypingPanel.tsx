import type { ContentItem, SessionResult } from "../domain/types";
import type { TypingSessionState } from "../engine/typingEngine";

interface TypingPanelProps {
  content: ContentItem | null;
  sessionState: TypingSessionState;
  result: SessionResult | null;
  onStart: () => void;
  onInput: (char: string) => void;
  onBackspace: () => void;
}

function renderPrompt(content: ContentItem, sessionState: TypingSessionState) {
  return [...content.prompt].map((char, index) => {
    let className = "";

    if (index < sessionState.cursor) {
      className = "prompt-char--correct";
    } else if (index === sessionState.cursor && sessionState.invalid) {
      className = "prompt-char--error";
    } else if (index === sessionState.cursor) {
      className = "prompt-char--cursor";
    }

    return (
      <span key={`${content.id}-${index}`} className={className}>
        {char}
      </span>
    );
  });
}

export function TypingPanel({
  content,
  sessionState,
  result,
  onStart,
  onInput,
  onBackspace,
}: TypingPanelProps) {
  if (!content) {
    return (
      <section className="typing-panel">
        <p>No practice content available for this mode right now.</p>
      </section>
    );
  }

  const isRunning = Boolean(sessionState.target);

  return (
    <section className="typing-panel">
      <div className="typing-panel__header">
        <p className="typing-panel__eyebrow">{content.category}</p>
        <h2>{content.label}</h2>
      </div>
      <pre className="typing-panel__prompt" data-testid="prompt-text">
        {renderPrompt(content, sessionState)}
      </pre>
      {!isRunning ? (
        <button type="button" onClick={onStart}>
          Start Practice
        </button>
      ) : (
        <label className="typing-panel__input">
          Typing Input
          <textarea
            aria-label="Typing input"
            autoFocus
            rows={3}
            onKeyDown={(event) => {
              if (event.key === "Backspace") {
                event.preventDefault();
                onBackspace();
                return;
              }

              if (event.key === "Enter") {
                event.preventDefault();
                onInput("\n");
                return;
              }

              if (event.key === "Tab") {
                event.preventDefault();
                onInput("\t");
              }
            }}
            onChange={(event) => {
              const value = event.currentTarget.value;
              const nextChar = value[value.length - 1];

              if (nextChar) {
                onInput(nextChar);
              }

              event.currentTarget.value = "";
            }}
          />
        </label>
      )}
      <div className="typing-panel__metrics">
        <p>Correct: {sessionState.correctChars}</p>
        <p>Errors: {sessionState.errorCount}</p>
        <p>Status: {result ? "Complete" : isRunning ? "Typing" : "Ready"}</p>
      </div>
    </section>
  );
}
