import { useState } from "react";

import type {
  AdminContentItem,
  PracticeCategory,
  PracticeDifficulty,
  PracticeLength,
  PracticeTopic,
} from "../domain/types";

export type ContentEditorValue = {
  category: PracticeCategory;
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  length: PracticeLength;
  label: string;
  prompt: string;
  isActive: boolean;
};

const defaultValues: ContentEditorValue = {
  category: "code",
  topic: "typescript",
  difficulty: "medium",
  length: "medium",
  label: "",
  prompt: "",
  isActive: true,
};

export function ContentEditor({
  initialValue,
  onCancel,
  onSave,
}: {
  initialValue?: AdminContentItem | null;
  onCancel: () => void;
  onSave: (value: ContentEditorValue) => Promise<void>;
}) {
  const [form, setForm] = useState<ContentEditorValue>(
    initialValue
      ? {
          category: initialValue.category,
          topic: initialValue.topic,
          difficulty: initialValue.difficulty,
          length: initialValue.length,
          label: initialValue.label,
          prompt: initialValue.prompt,
          isActive: initialValue.isActive,
        }
      : defaultValues,
  );
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
          await onSave(form);
        } finally {
          setSaving(false);
        }
      }}
    >
      <label>
        Label
        <input
          aria-label="Label"
          value={form.label}
          onChange={(event) =>
            setForm((current) => ({ ...current, label: event.target.value }))
          }
        />
      </label>
      <label>
        Prompt
        <textarea
          aria-label="Prompt"
          value={form.prompt}
          onChange={(event) =>
            setForm((current) => ({ ...current, prompt: event.target.value }))
          }
        />
      </label>
      <label>
        Active
        <input
          aria-label="Active"
          type="checkbox"
          checked={form.isActive}
          onChange={(event) =>
            setForm((current) => ({ ...current, isActive: event.target.checked }))
          }
        />
      </label>
      <div className="admin-form__actions">
        <button type="submit" disabled={saving}>
          Save Prompt
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
