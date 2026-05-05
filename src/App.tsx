import { AuthGate } from "./components/AuthGate";
import { ModePicker } from "./components/ModePicker";
import { ProgressSidebar } from "./components/ProgressSidebar";
import { ResultsPanel } from "./components/ResultsPanel";
import { TypingPanel } from "./components/TypingPanel";
import { useTypingSession } from "./hooks/useTypingSession";

function TrainerApp() {
  const session = useTypingSession();

  return (
    <main className="app-shell">
      <div className="dashboard">
        <section className="hero-card">
          <p className="eyebrow">Phase 1</p>
          <h1>Programmer Typing Trainer</h1>
          <p>
            Practice code, terminal commands, and technical English with
            developer-focused feedback.
          </p>
          <ModePicker
            mode={session.mode}
            focusedCategory={session.focusedCategory}
            onModeChange={session.setMode}
            onCategoryChange={session.setFocusedCategory}
          />
          <TypingPanel
            content={session.content}
            sessionState={session.sessionState}
            result={session.result}
            onStart={session.startSession}
            onInput={session.inputCharacter}
            onBackspace={session.backspace}
          />
          {session.result ? (
            <ResultsPanel result={session.result} onNext={session.nextSession} />
          ) : null}
        </section>
        <ProgressSidebar
          sessions={session.sessions}
          dailyChallenge={session.dailyChallenge}
          achievements={session.achievements}
        />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthGate>
      <TrainerApp />
    </AuthGate>
  );
}
