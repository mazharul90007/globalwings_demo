export type Mode = "online" | "in-person" | "phone";
export type ParticipantStatus = "pending" | "accepted" | "rejected" | "expired";
export type Attendance = "attended" | "no-show" | null;
export type Priority = "low" | "normal" | "high";

export interface Staff {
  id: number;
  name: string;
  role: string;
  color: string;
}

export interface Participant {
  id: string;
  staffId?: number;
  name: string;
  email: string;
  /** External people only, optional. */
  whatsapp?: string;
  external: boolean;
  status: ParticipantStatus;
  respondedAt?: string;
  reason?: string;
  attendance?: Attendance;
  emailFailed?: boolean;
}

export interface Activity {
  at: string;
  text: string;
}

export interface Meeting {
  id: string;
  kind: "meeting";
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string;
  mode: Mode;
  location?: string;
  link?: string;
  phone?: string;
  agenda?: string;
  organizerId: number;
  cancelled?: boolean;
  participants: Participant[];
  notes?: string;
  activity: Activity[];
}

export interface Todo {
  id: string;
  kind: "todo";
  title: string;
  date: string;
  start?: string;
  end?: string;
  priority: Priority;
  done: boolean;
  notes?: string;
  parentId?: string;
  /** The person who created the task. With no assignees, the task is only for them. */
  ownerId: number;
  /** Staff the task is assigned to. Each one accepts (it goes on their calendar) or rejects with a reason. */
  assignees?: TaskAssignee[];
}

export type TaskStatus = "pending" | "accepted" | "rejected";

export interface TaskAssignee {
  staffId: number;
  status: TaskStatus;
  /** Required when rejected. */
  reason?: string;
  respondedAt?: string;
  /** Each assignee marks their own part done. */
  done?: boolean;
}

export type ScheduleItem = Meeting | Todo;

export interface AppNotification {
  id: string;
  /** Staff member who sees this notification. Missing means the default user (Tanvir). */
  forId?: number;
  text: string;
  time: string;
  tone: "ok" | "bad" | "info" | "warn";
  unread: boolean;
}
