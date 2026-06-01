import { useState } from "react";

import { AdminView } from "./components/AdminView";
import { AuthGate } from "./components/AuthGate";
import { LeaderboardView } from "./components/LeaderboardView";
import { ModePicker } from "./components/ModePicker";
import { ProgressSidebar } from "./components/ProgressSidebar";
import { ResultsPanel } from "./components/ResultsPanel";
import { TypingPanel } from "./components/TypingPanel";
import { useTypingSession } from "./hooks/useTypingSession";

type AppView = "trainer" | "leaderboard" | "admin";

function TrainerApp({ onAuthExpired }: { onAuthExpired: () => void }) {
  const [view, setView] = useState<AppView>("trainer");
  const session = useTypingSession({ onAuthExpired });

  return (
    <main className="app-shell">
      <div className="dashboard">
        <section className="hero-card">
          <div className="app-switch">
            <button
              type="button"
              className={view === "trainer" ? "is-active" : undefined}
              onClick={() => setView("trainer")}
            >
              Trainer
            </button>
            <button
              type="button"
              className={view === "leaderboard" ? "is-active" : undefined}
              onClick={() => setView("leaderboard")}
            >
              Leaderboard
            </button>
            <button
              type="button"
              className={view === "admin" ? "is-active" : undefined}
              onClick={() => setView("admin")}
            >
              Admin
            </button>
          </div>
          {view === "admin" ? (
            <AdminView onAuthExpired={onAuthExpired} />
          ) : view === "trainer" ? (
            <>
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
                <ResultsPanel
                  result={session.result}
                  onNext={session.nextSession}
                />
              ) : null}
            </>
          ) : (
            <LeaderboardView onAuthExpired={onAuthExpired} />
          )}
        </section>
        <ProgressSidebar
          sessions={session.sessions}
          dailyChallenge={session.dailyChallenge}
          achievements={session.achievements}
          progressError={session.progressError}
        />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthGate>
      {({ onAuthExpired }) => <TrainerApp onAuthExpired={onAuthExpired} />}
    </AuthGate>
  );
}
