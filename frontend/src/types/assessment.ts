export type Evaluation = {
  id: string; state: 'submitted' | 'reviewed' | 'not_received';
  max_points: string; accepted_at: string; source_code?: string;
  student_name?: string; feedback?: { points_awarded: string | null; body: string; updated_at: string } | null;
};
export type PeriodReport = {
  meta?: { current_page: number; last_page: number; total: number } | null;
  classroom: { id: string; title: string; timezone: string }; generated_at: string;
  activities: { id: string; title: string; max_points: string; status: string }[];
  rows: { membership_id: string; name: string; email: string; membership_status: string;
    cells: { activity_id: string; state: string; latest_submission_id: string | null;
      points_awarded: string | null; closed: boolean; last_submission_at: string | null }[] }[];
};
