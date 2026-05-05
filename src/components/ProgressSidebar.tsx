import type { SessionResult, StoredDailyChallenge } from "../domain/types";
import type { AchievementState } from "../progress/achievementRules";

interface ProgressSidebarProps {
  sessions: SessionResult[];
  dailyChallenge: StoredDailyChallenge | null;
  achievements: AchievementState[];
}

export function ProgressSidebar({
  sessions,
  dailyChallenge,
  achievements,
}: ProgressSidebarProps) {
  return (
    <aside className="progress-sidebar">
      <section className="sidebar-card">
        <h2>Daily Challenge</h2>
        <p>{dailyChallenge?.completed ? "Completed today" : "Not completed yet"}</p>
        <p>
          Best: {dailyChallenge ? `${dailyChallenge.bestWpm} WPM / ${dailyChallenge.bestAccuracy}%` : "No score yet"}
        </p>
      </section>
      <section className="sidebar-card">
        <h2>Recent Sessions</h2>
        <p>{sessions.length} sessions saved locally</p>
        <p>{sessions[0] ? `Latest: ${sessions[0].wpm} WPM` : "Finish a session to start tracking progress."}</p>
      </section>
      <section className="sidebar-card">
        <h2>Achievements</h2>
        <p>{achievements.length} unlocked</p>
        <p>{achievements[0] ? `Latest: ${achievements[0].id}` : "Your first unlock is one good run away."}</p>
      </section>
    </aside>
  );
}
