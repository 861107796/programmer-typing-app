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
    let className = "prompt-char prompt-char--pending";

    if (index < sessionState.cursor) {
      className = "prompt-char prompt-char--correct";
    } else if (index === sessionState.cursor && sessionState.invalid) {
      className = "prompt-char prompt-char--error";
    } else if (index === sessionState.cursor) {
      className = "prompt-char prompt-char--cursor";
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
      <div className="typing-panel__arena" data-testid="prompt-arena">
        <div className="typing-panel__arena-hud">
          <span className="typing-panel__arena-label">Target Prompt</span>
          <span className="typing-panel__arena-status">
            {result ? "Cleared" : isRunning ? "Live Run" : "Armed"}
          </span>
        </div>
        <div className="typing-panel__surface" data-testid="prompt-surface">
          <pre className="typing-panel__prompt" data-testid="prompt-text">
            {renderPrompt(content, sessionState)}
          </pre>
        </div>
      </div>
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
      <div className="typing-panel__metrics" data-testid="typing-metrics">
        <div className="typing-panel__metric">
          <span className="typing-panel__metric-label">Correct</span>
          <strong className="typing-panel__metric-value typing-panel__metric-value--success">
            {sessionState.correctChars}
          </strong>
        </div>
        <div className="typing-panel__metric">
          <span className="typing-panel__metric-label">Errors</span>
          <strong className="typing-panel__metric-value typing-panel__metric-value--danger">
            {sessionState.errorCount}
          </strong>
        </div>
        <div className="typing-panel__metric">
          <span className="typing-panel__metric-label">Status</span>
          <strong className="typing-panel__metric-value">
            {result ? "Complete" : isRunning ? "Typing" : "Ready"}
          </strong>
        </div>
      </div>
    </section>
  );
}
