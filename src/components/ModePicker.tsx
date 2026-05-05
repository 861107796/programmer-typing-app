import type { PracticeCategory, PracticeMode } from "../domain/types";

interface ModePickerProps {
  mode: PracticeMode;
  focusedCategory: PracticeCategory;
  onModeChange: (mode: PracticeMode) => void;
  onCategoryChange: (category: PracticeCategory) => void;
}

export function ModePicker({
  mode,
  focusedCategory,
  onModeChange,
  onCategoryChange,
}: ModePickerProps) {
  return (
    <section className="mode-picker">
      <h2>Practice Mode</h2>
      <div className="mode-picker__buttons">
        <button type="button" onClick={() => onModeChange("mixed")}>
          Mixed
        </button>
        <button type="button" onClick={() => onModeChange("focused")}>
          Focused
        </button>
        <button type="button" onClick={() => onModeChange("daily")}>
          Daily Challenge
        </button>
      </div>
      {mode === "focused" ? (
        <label className="mode-picker__select">
          Focus category
          <select
            value={focusedCategory}
            onChange={(event) =>
              onCategoryChange(event.target.value as PracticeCategory)
            }
          >
            <option value="code">Code</option>
            <option value="command">Command Line</option>
            <option value="technical">Technical English</option>
          </select>
        </label>
      ) : null}
    </section>
  );
}
