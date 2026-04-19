import type { RecurringConfig, WeekDay, RecurringFrequency } from "@task-app/shared";
import {
  WEEKDAY_LABELS,
  defaultRecurring,
  nthWeekdayOfMonth,
  nthWeekdayLabel,
} from "../utils/recurring.js";
import { toDateInputValue, fromDateInputValue } from "../utils/dates.js";

interface Props {
  value: RecurringConfig | null;
  dueDate: string | null;
  onChange: (next: RecurringConfig | null) => void;
}

export function RecurringEditor({ value, dueDate, onChange }: Props) {
  const enabled = !!value?.enabled;
  const config = value;
  const dueDateObj = dueDate ? new Date(dueDate) : null;

  function setEnabled(on: boolean) {
    if (!on) return onChange(null);
    onChange(defaultRecurring("weekly", dueDateObj));
  }

  function setFrequency(freq: RecurringFrequency) {
    onChange(defaultRecurring(freq, dueDateObj));
  }

  function patch(p: Partial<RecurringConfig>) {
    if (!config) return;
    onChange({ ...config, ...p });
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Recurring
      </label>

      {enabled && config && (
        <div className="space-y-3 rounded border border-ink-100 bg-ink-50/40 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-500">Every</span>
            <input
              type="number"
              min={1}
              max={365}
              value={config.interval}
              onChange={(e) => patch({ interval: Math.max(1, Number(e.target.value) || 1) })}
              className="w-16 rounded border border-ink-100 px-2 py-1 text-sm"
            />
            <select
              value={config.frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="rounded border border-ink-100 px-2 py-1 text-sm"
            >
              <option value="daily">{config.interval === 1 ? "day" : "days"}</option>
              <option value="weekly">{config.interval === 1 ? "week" : "weeks"}</option>
              <option value="monthly">{config.interval === 1 ? "month" : "months"}</option>
              <option value="yearly">{config.interval === 1 ? "year" : "years"}</option>
            </select>
          </div>

          {config.frequency === "weekly" && (
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">On</div>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label, idx) => {
                  const day = idx as WeekDay;
                  const active = config.daysOfWeek?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const set = new Set<WeekDay>(config.daysOfWeek ?? []);
                        if (set.has(day)) set.delete(day);
                        else set.add(day);
                        patch({ daysOfWeek: Array.from(set).sort((a, b) => a - b) });
                      }}
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        active
                          ? "border-ink-900 bg-ink-900 text-white"
                          : "border-ink-100 bg-white text-ink-700 hover:border-ink-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {config.frequency === "monthly" && <MonthlyControls value={config} dueDate={dueDateObj} onChange={patch} />}

          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">Ends</div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={!config.endDate}
                  onChange={() => patch({ endDate: null })}
                />
                Never
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={!!config.endDate}
                  onChange={() => patch({ endDate: fromDateInputValue(toDateInputValue(new Date().toISOString())) })}
                />
                On
              </label>
              {config.endDate && (
                <input
                  type="date"
                  value={toDateInputValue(config.endDate)}
                  onChange={(e) => patch({ endDate: fromDateInputValue(e.target.value) })}
                  className="rounded border border-ink-100 px-2 py-1 text-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyControls({
  value,
  dueDate,
  onChange,
}: {
  value: RecurringConfig;
  dueDate: Date | null;
  onChange: (p: Partial<RecurringConfig>) => void;
}) {
  const ref = dueDate ?? new Date();
  const dayOption = ref.getDate();
  const nthOption = nthWeekdayOfMonth(ref);
  const mode = value.monthly ?? { kind: "dayOfMonth", day: dayOption };

  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">Pattern</div>
      <div className="space-y-1 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode.kind === "dayOfMonth"}
            onChange={() => onChange({ monthly: { kind: "dayOfMonth", day: dayOption } })}
          />
          On day {dayOption} of the month
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode.kind === "nthWeekday"}
            onChange={() => onChange({ monthly: { kind: "nthWeekday", nth: nthOption.nth, weekday: nthOption.weekday } })}
          />
          On the {nthWeekdayLabel(nthOption.nth, nthOption.weekday)}
        </label>
      </div>
    </div>
  );
}
