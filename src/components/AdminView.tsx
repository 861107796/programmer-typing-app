import { useEffect, useMemo, useState } from "react";

import {
  assignAdminDailyChallenge,
  buildAdminContentQuery,
  createAdminContent,
  deleteAdminContent,
  fetchAdminContent,
  fetchAdminDailyChallenges,
  generateAdminDailyChallenge,
  updateAdminContent,
} from "../admin/adminApi";
import type {
  AdminChallengeAssignment,
  AdminContentItem,
  PracticeCategory,
  PracticeDifficulty,
  PracticeTopic,
} from "../domain/types";
import { ContentEditor, type ContentEditorValue } from "./ContentEditor";

type AdminTab = "content" | "daily";

function formatPromptPreview(prompt: string) {
  const compact = prompt.replace(/\s+/g, " ").trim();
  return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
}

const categoryOptions: Array<PracticeCategory | ""> = [
  "",
  "code",
  "command",
  "technical",
];

const topicOptions: Array<PracticeTopic | ""> = [
  "",
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "go",
  "rust",
  "sql",
  "shell",
  "json",
  "yaml",
  "git",
  "npm",
  "pip",
  "filesystem",
  "search",
  "docker",
  "curl",
  "api",
  "database",
  "logging",
  "deploy",
  "debugging",
  "docs",
  "errors",
  "algorithm",
  "llm",
  "ml",
  "react",
  "concurrency",
  "testing",
  "devops",
  "security",
  "database_advanced",
  "compiler",
];

const difficultyOptions: Array<PracticeDifficulty | ""> = [
  "",
  "easy",
  "medium",
  "hard",
];

export function AdminView({ onAuthExpired }: { onAuthExpired: () => void }) {
  const [tab, setTab] = useState<AdminTab>("content");
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [assignments, setAssignments] = useState<AdminChallengeAssignment[]>([]);
  const [editing, setEditing] = useState<AdminContentItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("2026-05-05");
  const [selectedContentId, setSelectedContentId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PracticeCategory | "">("");
  const [selectedTopic, setSelectedTopic] = useState<PracticeTopic | "">("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<PracticeDifficulty | "">("");

  async function loadContent() {
    try {
      const response = await fetchAdminContent(
        buildAdminContentQuery({
          category: selectedCategory || undefined,
          topic: selectedTopic || undefined,
          difficulty: selectedDifficulty || undefined,
        }),
      );
      setItems(response.items);
      if (!selectedContentId && response.items[0]) {
        setSelectedContentId(response.items[0].id);
      }
    } catch (reason) {
      if (reason instanceof Error && reason.message === "AUTH_EXPIRED") {
        onAuthExpired();
        return;
      }

      setError(
        reason instanceof Error ? reason.message : "Unable to load content",
      );
    }
  }

  async function loadAssignments() {
    try {
      const response = await fetchAdminDailyChallenges(selectedDate);
      setAssignments(response.assignments);
    } catch (reason) {
      if (reason instanceof Error && reason.message === "AUTH_EXPIRED") {
        onAuthExpired();
        return;
      }

      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load daily challenge",
      );
    }
  }

  useEffect(() => {
    void loadContent();
  }, [selectedCategory, selectedDifficulty, selectedTopic]);

  useEffect(() => {
    void loadAssignments();
  }, [selectedDate]);

  const contentOptions = useMemo(
    () => items.map((item) => ({ value: item.id, label: item.label })),
    [items],
  );

  async function saveContent(value: ContentEditorValue) {
    try {
      const next = editing
        ? await updateAdminContent(editing.id, value)
        : await createAdminContent(value);
      setItems((current) =>
        editing
          ? current.map((item) => (item.id === next.id ? next : item))
          : [next, ...current],
      );
      setSelectedContentId((current) => current || next.id);
      setCreating(false);
      setEditing(null);
      setError(null);
    } catch (reason) {
      if (reason instanceof Error && reason.message === "AUTH_EXPIRED") {
        onAuthExpired();
        return;
      }
      setError(
        reason instanceof Error ? reason.message : "Unable to save prompt",
      );
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Content Admin</h2>
        </div>
        <div className="admin-tabs">
          <button
            type="button"
            className={tab === "content" ? "is-active" : undefined}
            onClick={() => setTab("content")}
          >
            Content
          </button>
          <button
            type="button"
            className={tab === "daily" ? "is-active" : undefined}
            onClick={() => setTab("daily")}
          >
            Daily Challenge
          </button>
        </div>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      {tab === "content" ? (
        <>
          <div className="admin-actions">
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setEditing(null);
                setError(null);
              }}
            >
              New Prompt
            </button>
          </div>
          <div className="admin-filters">
            <label>
              Category
              <select
                aria-label="Category filter"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value as PracticeCategory | "")
                }
              >
                {categoryOptions.map((option) => (
                  <option key={option || "all-categories"} value={option}>
                    {option || "All categories"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Topic
              <select
                aria-label="Topic filter"
                value={selectedTopic}
                onChange={(event) =>
                  setSelectedTopic(event.target.value as PracticeTopic | "")
                }
              >
                {topicOptions.map((option) => (
                  <option key={option || "all-topics"} value={option}>
                    {option || "All topics"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Difficulty
              <select
                aria-label="Difficulty filter"
                value={selectedDifficulty}
                onChange={(event) =>
                  setSelectedDifficulty(event.target.value as PracticeDifficulty | "")
                }
              >
                {difficultyOptions.map((option) => (
                  <option key={option || "all-difficulties"} value={option}>
                    {option || "All difficulties"}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {creating ? (
            <ContentEditor
              initialValue={null}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
              }}
              onSave={saveContent}
            />
          ) : null}
          <div className="admin-list admin-list--content">
            {items.length === 0 ? (
              <p className="admin-empty">
                No prompts yet. Create your first prompt to start managing
                content.
              </p>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className={`admin-item${editing?.id === item.id ? " admin-item--editing" : ""}`}
                >
                  <div className="admin-item__summary">
                    <div className="admin-item__heading">
                      <h3>{item.label}</h3>
                      <span
                        className={`admin-item__status${item.isActive ? " is-active" : " is-inactive"}`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="admin-item__meta">
                      {item.category} · {item.topic} · {item.difficulty} · {item.length}
                    </p>
                    <p className="admin-item__preview">
                      {formatPromptPreview(item.prompt)}
                    </p>
                  </div>
                  <div className="admin-form__actions">
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        setEditing(item);
                        setError(null);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteAdminContent(item.id);
                          setItems((current) =>
                            current.filter((entry) => entry.id !== item.id),
                          );
                          if (editing?.id === item.id) {
                            setEditing(null);
                          }
                          setError(null);
                        } catch (reason) {
                          if (
                            reason instanceof Error &&
                            reason.message === "AUTH_EXPIRED"
                          ) {
                            onAuthExpired();
                            return;
                          }
                          setError(
                            reason instanceof Error
                              ? reason.message
                              : "Unable to delete prompt",
                          );
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  {editing?.id === item.id ? (
                    <ContentEditor
                      initialValue={editing}
                      onCancel={() => {
                        setEditing(null);
                      }}
                      onSave={saveContent}
                    />
                  ) : null}
                </article>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="admin-daily">
          <label>
            Date
            <input
              aria-label="Date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <label>
            Prompt
            <select
              aria-label="Prompt"
              value={selectedContentId}
              onChange={(event) => setSelectedContentId(event.target.value)}
            >
              <option value="">Choose a prompt</option>
              {contentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form__actions">
            <button
              type="button"
              onClick={async () => {
                try {
                  const next = await assignAdminDailyChallenge(
                    selectedDate,
                    selectedContentId,
                  );
                  setAssignments([next]);
                  setError(null);
                } catch (reason) {
                  if (
                    reason instanceof Error &&
                    reason.message === "AUTH_EXPIRED"
                  ) {
                    onAuthExpired();
                    return;
                  }
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : "Unable to assign challenge",
                  );
                }
              }}
            >
              Assign Challenge
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const next = await generateAdminDailyChallenge(selectedDate);
                  setAssignments([next]);
                  setSelectedContentId(next.contentItemId);
                  setError(null);
                } catch (reason) {
                  if (
                    reason instanceof Error &&
                    reason.message === "AUTH_EXPIRED"
                  ) {
                    onAuthExpired();
                    return;
                  }
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : "Unable to generate challenge",
                  );
                }
              }}
            >
              Generate Challenge
            </button>
          </div>
          <div className="admin-list">
            {assignments.length === 0 ? (
              <p className="admin-empty">
                No challenge assignment for this date yet.
              </p>
            ) : (
              assignments.map((assignment) => (
                <article
                  key={`${assignment.dateKey}-${assignment.contentItemId}`}
                  className="admin-item"
                >
                  <h3>{assignment.dateKey}</h3>
                  <p>{assignment.source}</p>
                  <p>{assignment.contentItemId}</p>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
