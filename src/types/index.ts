export type Page = "landing" | "login" | "admin-dashboard" | "student-dashboard" | "feedback-form" | "feedback-history";
export type Role = "student" | "admin" | "hod" | "faculty";

export interface User {
  id: string;
  username: string;
  role: Role;
}
export interface ActiveSession {
  id: number;
  faculty: string;
  subject: string;
  code: string;
  dept: string;
  deadline: string;
  status: "open" | "closed";
  submitted: boolean;
}

export interface Question {
  id: number;
  text: string;
}

export interface HistoryItem {
  id: number;
  subject: string;
  faculty: string;
  code: string;
  date: string;
  session: string;
}
