export type UserRole = "super_admin" | "trainer" | "manager" | "employee";

export interface Company {
  id: string;
  name: string;
  name_ar: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface User {
  id: string;
  company_id: string | null;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  points: number;
  bio: string | null;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_by: string;
  assigned_role: UserRole;
  is_published: boolean;
  created_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  video_url: string | null;
  order_index: number;
  created_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: "opened" | "in_progress" | "completed";
  updated_at: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total: number;
  completed_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  share_token: string;
  user?: User;
  course?: Course;
}

export interface OutfitSubmission {
  id: string;
  company_id: string;
  user_id: string;
  image_url: string;
  week_number: number;
  year: number;
  is_winner: boolean;
  created_at: string;
  user?: User;
}

export interface SalesEntry {
  id: string;
  company_id: string;
  user_id: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
  user?: User;
}

export interface Star {
  id: string;
  company_id: string;
  user_id: string;
  type: "week" | "month";
  period: string;
  chosen_by: string;
  created_at: string;
  user?: User;
}

export interface ChatMessage {
  id: string;
  company_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "lesson_opened" | "lesson_completed" | "new_star" | "outfit_winner" | "certificate";
  title: string;
  body: string;
  is_read: boolean;
  metadata: Record<string, string> | null;
  created_at: string;
}

export interface Suggestion {
  id: string;
  company_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface TrainerNote {
  id: string;
  trainer_id: string;
  employee_id: string;
  content: string;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  role: "trainer" | "manager" | "employee";
  company_id: string | null;
  company_name: string | null;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

export interface XpEvent {
  id: string;
  user_id: string;
  company_id: string | null;
  type: string;
  xp: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
}
