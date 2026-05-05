import type { SessionResult } from "../domain/types";

interface ResultsPanelProps {
  result: SessionResult;
  onNext: () => void;
}

export function ResultsPanel({ result, onNext }: ResultsPanelProps) {
  return (
    <section className="results-panel" aria-labelledby="results-heading">
      <div className="results-panel__header">
        <h2 id="results-heading">Session Results</h2>
        <button type="button" onClick={onNext}>
          Skip Prompt
        </button>
      </div>
      <dl className="results-grid">
        <div>
          <dt>WPM</dt>
          <dd>{result.wpm}</dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>{result.accuracy}%</dd>
        </div>
        <div>
          <dt>Errors</dt>
          <dd>{result.errorCount}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{Math.round(result.durationMs / 1000)}s</dd>
        </div>
      </dl>
    </section>
  );
}
