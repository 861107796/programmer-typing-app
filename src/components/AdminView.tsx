import { useEffect, useMemo, useState } from "react";

import {
  assignAdminDailyChallenge,
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
} from "../domain/types";
import { ContentEditor, type ContentEditorValue } from "./ContentEditor";

type AdminTab = "content" | "daily";

export function AdminView({ onAuthExpired }: { onAuthExpired: () => void }) {
  const [tab, setTab] = useState<AdminTab>("content");
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [assignments, setAssignments] = useState<AdminChallengeAssignment[]>([]);
  const [editing, setEditing] = useState<AdminContentItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("2026-05-05");
  const [selectedContentId, setSelectedContentId] = useState("");

  async function loadContent() {
    try {
      const response = await fetchAdminContent();
      setItems(response.items);
      if (!selectedContentId && response.items[0]) {
        setSelectedContentId(response.items[0].id);
      }
    } catch (reason) {
      if (reason instanceof Error && reason.message === "AUTH_EXPIRED") {
        onAuthExpired();
        return;
      }

      setError(reason instanceof Error ? reason.message : "Unable to load content");
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
        reason instanceof Error ? reason.message : "Unable to load daily challenge",
      );
    }
  }

  useEffect(() => {
    void loadContent();
  }, []);

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
      setError(reason instanceof Error ? reason.message : "Unable to save prompt");
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
          {creating || editing ? (
            <ContentEditor
              initialValue={editing}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
              }}
              onSave={saveContent}
            />
          ) : null}
          <div className="admin-list">
            {items.map((item) => (
              <article key={item.id} className="admin-item">
                <h3>{item.label}</h3>
                <p>
                  {item.topic} · {item.difficulty} · {item.length}
                </p>
                <p>{item.isActive ? "Active" : "Inactive"}</p>
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
              </article>
            ))}
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
                  if (reason instanceof Error && reason.message === "AUTH_EXPIRED") {
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
                  if (reason instanceof Error && reason.message === "AUTH_EXPIRED") {
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
            {assignments.map((assignment) => (
              <article
                key={`${assignment.dateKey}-${assignment.contentItemId}`}
                className="admin-item"
              >
                <h3>{assignment.dateKey}</h3>
                <p>{assignment.source}</p>
                <p>{assignment.contentItemId}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
