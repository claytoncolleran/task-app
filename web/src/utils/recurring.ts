import type { RecurringConfig, WeekDay, MonthlyMode } from "@task-app/shared";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAY_LABELS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function nthWeekdayOfMonth(date: Date): { nth: 1 | 2 | 3 | 4 | -1; weekday: WeekDay } {
  const day = date.getDate();
  const nth = Math.ceil(day / 7) as 1 | 2 | 3 | 4;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const isLastOccurrence = day + 7 > daysInMonth;
  return {
    nth: isLastOccurrence && nth >= 4 ? -1 : nth,
    weekday: date.getDay() as WeekDay,
  };
}

export function nthWeekdayLabel(nth: 1 | 2 | 3 | 4 | -1, weekday: WeekDay): string {
  const names: Record<number, string> = { 1: "first", 2: "second", 3: "third", 4: "fourth", [-1]: "last" };
  return `${names[nth]} ${WEEKDAY_LABELS_LONG[weekday]}`;
}

export function describeRecurring(config: RecurringConfig): string {
  if (!config.enabled) return "Not recurring";
  const n = Math.max(1, config.interval || 1);
  const every = n === 1 ? "Every" : `Every ${n}`;
  switch (config.frequency) {
    case "daily":
      return n === 1 ? "Every day" : `Every ${n} days`;
    case "weekly": {
      const days = (config.daysOfWeek ?? []).slice().sort((a, b) => a - b);
      const dayList = days.length ? days.map((d) => WEEKDAY_LABELS[d]).join(", ") : "—";
      return n === 1 ? `Weekly on ${dayList}` : `Every ${n} weeks on ${dayList}`;
    }
    case "monthly": {
      if (config.monthly?.kind === "nthWeekday") {
        return `${every} month on the ${nthWeekdayLabel(config.monthly.nth, config.monthly.weekday)}`;
      }
      const day = config.monthly?.kind === "dayOfMonth" ? config.monthly.day : null;
      return day ? `${every} month on day ${day}` : `${every} month`;
    }
    case "yearly":
      return n === 1 ? "Every year" : `Every ${n} years`;
  }
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function findNextWeekly(from: Date, allowedDays: WeekDay[], weekInterval: number): Date {
  const sortedDays = [...new Set(allowedDays)].sort((a, b) => a - b) as WeekDay[];
  if (sortedDays.length === 0) return addDays(from, 7 * weekInterval);
  const fromDay = from.getDay();
  for (const d of sortedDays) {
    if (d > fromDay) return addDays(from, d - fromDay);
  }
  const daysUntilNextSunday = 7 - fromDay;
  const jumpWeeks = Math.max(0, weekInterval - 1);
  return addDays(from, daysUntilNextSunday + jumpWeeks * 7 + sortedDays[0]);
}

function nextMonthly(from: Date, mode: MonthlyMode, monthInterval: number): Date {
  const next = new Date(from.getFullYear(), from.getMonth() + monthInterval, 1, from.getHours(), from.getMinutes());
  if (mode.kind === "dayOfMonth") {
    const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(mode.day, daysInMonth));
  } else {
    const firstDay = next.getDay();
    const firstOccurrence = ((mode.weekday - firstDay + 7) % 7) + 1;
    if (mode.nth === -1) {
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      let last = firstOccurrence;
      while (last + 7 <= daysInMonth) last += 7;
      next.setDate(last);
    } else {
      next.setDate(firstOccurrence + (mode.nth - 1) * 7);
    }
  }
  return next;
}

export function nextOccurrence(config: RecurringConfig, fromIso: string | null): string | null {
  if (!config.enabled) return null;
  const from = fromIso ? new Date(fromIso) : new Date();
  const interval = Math.max(1, config.interval || 1);
  let next: Date;

  switch (config.frequency) {
    case "daily":
      next = addDays(from, interval);
      break;
    case "weekly": {
      const days =
        config.daysOfWeek && config.daysOfWeek.length
          ? config.daysOfWeek
          : ([from.getDay()] as WeekDay[]);
      next = findNextWeekly(from, days, interval);
      break;
    }
    case "monthly": {
      const mode: MonthlyMode = config.monthly ?? { kind: "dayOfMonth", day: from.getDate() };
      next = nextMonthly(from, mode, interval);
      break;
    }
    case "yearly":
      next = new Date(from);
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  if (config.endDate) {
    const end = new Date(config.endDate);
    if (next > end) return null;
  }
  return next.toISOString();
}

export function defaultRecurring(frequency: RecurringConfig["frequency"], dueDate: Date | null): RecurringConfig {
  const base: RecurringConfig = { enabled: true, frequency, interval: 1 };
  if (frequency === "weekly") {
    base.daysOfWeek = [(dueDate ?? new Date()).getDay() as WeekDay];
  } else if (frequency === "monthly") {
    base.monthly = { kind: "dayOfMonth", day: (dueDate ?? new Date()).getDate() };
  }
  return base;
}
