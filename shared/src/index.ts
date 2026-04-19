export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type MonthlyMode =
  | { kind: "dayOfMonth"; day: number }
  | { kind: "nthWeekday"; nth: 1 | 2 | 3 | 4 | -1; weekday: WeekDay };

export interface RecurringConfig {
  enabled: boolean;
  frequency: RecurringFrequency;
  interval: number;
  daysOfWeek?: WeekDay[];
  monthly?: MonthlyMode;
  endDate?: string | null;
}

export interface TaskLink {
  url: string;
  title: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string | null;
  groupId: string | null;
  link: TaskLink | null;
  isCompleted: boolean;
  completedDate: string | null;
  recurring: RecurringConfig | null;
  createdDate: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Group {
  id: string;
  userId: string;
  name: string;
  createdDate: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface User {
  id: string;
  email: string;
  createdDate: string;
}

export interface SyncPushRequest {
  tasks: Task[];
  groups: Group[];
  since: string | null;
}

export interface SyncPullResponse {
  tasks: Task[];
  groups: Group[];
  serverTime: string;
}

export interface MagicLinkRequestBody {
  email: string;
}

export interface MagicLinkVerifyBody {
  token: string;
}

export interface AuthSessionResponse {
  token: string;
  user: User;
}

export interface FetchLinkTitleResponse {
  url: string;
  title: string;
}
