import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { Pagination } from "@/components/ui/pagination";
import { ClassroomManagement } from "@/components/features/classrooms/classroom-management";
import { readDomain } from "@/services/classroom-service";
import type { Classroom, PageData } from "@/types/classroom";
import type { Activity } from "@/types/activity";
import type { Role } from "@/types/user";
export function ActivitySection({ role }: { role: Role }) {
  const { classroomId } = useParams();
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState("");
  const [session, setSession] = useState("");
  const [type, setType] = useState("");
  const [manage, setManage] = useState(false);
  const path = `/classrooms/${classroomId}`;
  const classroom = useQuery({
    queryKey: ["domain", "classroom", classroomId],
    queryFn: () => readDomain<{ data: Classroom }>(path),
  });
  const filters = new URLSearchParams({
    page: String(page),
    ...(period && { grading_period: period }),
    ...(session && { class_session: session }),
    ...(type && { activity_type: type }),
  });
  const activities = useQuery({
    queryKey: ["domain", "activities", classroomId, filters.toString()],
    queryFn: () =>
      readDomain<PageData<Activity>>(`${path}/activities?${filters}`),
    enabled: !!classroom.data,
  });
  if (classroom.isPending) return <p role="status">Loading classroom...</p>;
  if (classroom.isError)
    return (
      <section className="panel">
        <h1>Classroom unavailable</h1>
        <p role="alert">Check your enrollment or try again.</p>
        <Button onClick={() => void classroom.refetch()}>Try again</Button>
      </section>
    );
  const c = classroom.data.data;
  return (
    <>
      <Link className="back-link" to={`/${role}/classrooms`}>
        All classrooms
      </Link>
      <PageHeading
        eyebrow={`${c.course_code} / ${c.section_label} / ${c.academic_year_start}-${c.academic_year_end} / ${c.semester}`}
        title={c.title}
        description={`${c.status === "archived" ? "Archived classroom. " : ""}Deadlines and weekly slots use ${c.timezone}.`}
        action={
          role === "instructor" && c.status === "active" ? (
            <Button asChild>
              <Link to={`/instructor/classrooms/${c.id}/activities/new`}>
                Create activity
              </Link>
            </Button>
          ) : undefined
        }
      />
      <div className="panel mb-6">
        <h2>Weekly schedule</h2>
        {c.schedules.length ? (
          <ul className="mt-3 space-y-2">
            {c.schedules.map((s, i) => (
              <li key={i}>
                {s.class_session.toUpperCase()} /{" "}
                {
                  [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ][s.day_of_week - 1]
                }{" "}
                / {s.starts_at.slice(0, 5)}-{s.ends_at.slice(0, 5)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted mt-2">Schedule not set yet.</p>
        )}
      </div>
      {role === "instructor" && (
        <>
          <Button
            variant="outline"
            onClick={() => setManage(!manage)}
            aria-expanded={manage}
          >
            Manage classroom
          </Button>
          {manage && <ClassroomManagement classroom={c} />}
        </>
      )}
      <div className="flex flex-wrap gap-4 my-6">
        <label className="field-label">
          Grading period
          <select
            className="select"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All periods</option>
            <option value="prelim">Prelim</option>
            <option value="midterm">Midterm</option>
            <option value="semi_final">Semi-Final</option>
            <option value="final">Final</option>
          </select>
        </label>
        <label className="field-label">
          Class session
          <select
            className="select"
            value={session}
            onChange={(e) => {
              setSession(e.target.value);
              setPage(1);
            }}
          >
            <option value="">OC and LAB</option>
            <option value="oc">OC</option>
            <option value="lab">LAB</option>
          </select>
        </label>
        <label className="field-label">
          Activity type
          <select
            className="select"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All types</option>
            <option value="activity">Activity</option>
            <option value="assignment">Assignment</option>
          </select>
        </label>
      </div>
      {activities.isPending && <p role="status">Loading activities...</p>}
      {activities.isError && (
        <div>
          <p role="alert">Activities could not be loaded.</p>
          <Button onClick={() => void activities.refetch()}>Try again</Button>
        </div>
      )}
      {activities.data && (
        <>
          <section className="panel">
            <h2>Activities and assignments</h2>
            {activities.data.data.length === 0 && (
              <p className="muted mt-4">No activities match these filters.</p>
            )}
            {activities.data.data.map((a) => (
              <article className="domain-activity-row" key={a.id}>
                <div>
                  <p className="eyebrow">
                    {a.grading_period.replace("_", "-")} /{" "}
                    {a.class_session.toUpperCase()} / {a.activity_type}
                  </p>
                  <h3 className="mt-2">
                    <Link
                      className="text-link"
                      to={`/${role}/classrooms/${c.id}/activities/${a.id}`}
                    >
                      {a.title}
                    </Link>
                  </h3>
                  <p className="muted text-sm mt-2">
                    Due{" "}
                    {new Date(a.deadline_at).toLocaleString(undefined, {
                      timeZone: c.timezone,
                    })}{" "}
                    / {a.submission_limit} attempts
                  </p>
                </div>
                <span className="text-sm">
                  {a.allocation_status === "not_assigned"
                    ? "Not assigned"
                    : a.status}
                </span>
              </article>
            ))}
          </section>
          <Pagination
            page={page}
            lastPage={activities.data.meta.last_page}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}
