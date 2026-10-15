export type Schedule = {
  class_session: "oc" | "lab";
  day_of_week: number;
  starts_at: string;
  ends_at: string;
};
export type Classroom = {
  id: string;
  title: string;
  course_code: string;
  section_label: string;
  academic_year_start: number;
  academic_year_end: number;
  semester: "First" | "Second" | "Summer";
  term_end_date: string;
  timezone: string;
  status: "active" | "archived";
  schedules: Schedule[];
};
export type Membership = {
  id: string;
  name: string;
  email: string;
  student_number: string | null;
  status: "active" | "removed";
  joined_at: string;
};
export type PageData<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
};
