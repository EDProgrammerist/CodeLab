import { SubmissionHistory } from '@/components/features/editor/submission-history';
import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeading } from "@/components/ui/page-heading";
import { readDomain, writeDomain } from "@/services/classroom-service";
import { useDomainAction } from "@/hooks/use-domain-action";
import type { Activity } from "@/types/activity";
import type { Classroom } from "@/types/classroom";

function ActivityForm({
  classroom,
  activity,
  languages,
}: {
  classroom: Classroom;
  activity?: Activity;
  languages: { id: string; display_name: string }[];
}) {
  const navigate = useNavigate();
  const action = useDomainAction();
  const [searchParams] = useSearchParams();
  const [workType, setWorkType] = useState(activity?.activity_type ?? (searchParams.get('type') === 'assignment' ? 'assignment' : 'activity'));
  const workLabel = workType === 'assignment' ? 'Assignment' : 'Activity';
  const published = !!activity?.published_at;
  const closed =
    activity?.status === "archived" || classroom.status === "archived";
  const base = `/classrooms/${classroom.id}/activities`;
  const endpoint = activity ? `${base}/${activity.id}` : base;
  const localDate = activity
    ? new Date(
        new Date(activity.deadline_at).getTime() -
          new Date(activity.deadline_at).getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
  return (
    <>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          const fields = Object.fromEntries(new FormData(e.currentTarget));
          void action.run(
            async () => {
              const payload = {
                ...fields,
                ...(!published && { status: "published" }),
                deadline_at: new Date(String(fields.deadline_at)).toISOString(),
              };
              const response = await writeDomain<{ data: Activity }>(
                endpoint,
                activity ? "patch" : "post",
                payload,
              );
              if (!activity)
                navigate(
                  `/instructor/classrooms/${classroom.id}/activities/${response.data.id}`,
                  { replace: true },
                );
            },
            published
              ? "Changes saved."
              : `${workLabel} published.`,
          );
        }}
      >
        <section className="panel space-y-5">
          <h2>{`${workLabel} details`}</h2>
          <fieldset disabled={published || closed} className="space-y-5">
            <label className="field-label">
              Title
              <Input
                name="title"
                required
                maxLength={150}
                defaultValue={activity?.title}
              />
            </label>
            <label className="field-label">
              Questions
              <Textarea
                name="instructions"
                required
                rows={6}
                maxLength={20000}
                defaultValue={activity?.instructions}
              />
            </label>
            <div className="form-grid">
              <label className="field-label">
                Grading period
                <select
                  name="grading_period"
                  className="select"
                  defaultValue={activity?.grading_period ?? "prelim"}
                >
                  <option value="prelim">Prelim</option>
                  <option value="midterm">Midterm</option>
                  <option value="semi_final">Semi-Final</option>
                  <option value="final">Final</option>
                </select>
              </label>
              <label className="field-label">
                Class session
                <select
                  name="class_session"
                  className="select"
                  defaultValue={activity?.class_session ?? "lab"}
                >
                  <option value="oc">OC</option>
                  <option value="lab">LAB</option>
                </select>
              </label>
              <label className="field-label">
                Work type
                <select
                  name="activity_type"
                  className="select"
                  value={workType}
                  onChange={e => setWorkType(e.target.value as "activity" | "assignment")}
                >
                  <option value="activity">Activity</option>
                  <option value="assignment">Assignment</option>
                </select>
              </label>
              <input type="hidden" name="language_id" value={activity?.language_id ?? languages[0]?.id ?? ""} />

            </div>
          </fieldset>
          <p className="muted text-sm">
            Questions and categories are fixed once shared with students.
          </p>
          <fieldset disabled={closed} className="form-grid">
            <label className="field-label">
              Deadline (your device time)
              <Input
                name="deadline_at"
                type="datetime-local"
                required
                defaultValue={localDate}
              />
            </label>
            <label className="field-label">
              Points
              <Input
                name="max_points"
                type="number"
                required
                min={0.01}
                step={0.01}
                disabled={published && Number(activity?.max_points) > 0}
                max={1000}
                defaultValue={Number(activity?.max_points) || 100}
              />
            </label>
          </fieldset>
          <p className="muted text-sm">
            Classroom timezone: {classroom.timezone}. Device time is converted
            to UTC when saved. No late submissions; after publication, deadlines
            can only be extended. Points are fixed after publishing; legacy activities without points can be configured once.
          </p>
        </section>
        {!closed && (
          <Button disabled={action.busy || (!activity && !languages.length)}>
            {action.busy
              ? "Saving..."
              : activity
                ? "Save changes"
                : "Publish"}
          </Button>
        )}
      </form>
      {action.error && (
        <p className="mt-4" role="alert">
          {action.error}
        </p>
      )}
      {action.message && (
        <p className="mt-4" role="status">
          {action.message}
        </p>
      )}
    </>
  );
}
export function AuthoringSection() {
  const { classroomId, activityId } = useParams();
  const [searchParams] = useSearchParams();
  const classroom = useQuery({
    queryKey: ["domain", "classroom", classroomId],
    queryFn: () =>
      readDomain<{ data: Classroom }>(`/classrooms/${classroomId}`),
    enabled: !!classroomId,
  });
  const activity = useQuery({
    queryKey: ["domain", "activity", classroomId, activityId],
    queryFn: () =>
      readDomain<{ data: Activity }>(
        `/classrooms/${classroomId}/activities/${activityId}`,
      ),
    enabled: !!classroomId && !!activityId,
  });
  const languages = useQuery({
    queryKey: ["domain", "languages"],
    queryFn: () =>
      readDomain<{ data: { id: string; display_name: string }[] }>(
        "/languages",
      ),
  });
  if (!classroomId)
    return (
      <section className="panel">
        <h1>Choose a classroom first</h1>
        <p className="muted my-4">
          Activities belong to one course, section and term.
        </p>
        <Button asChild>
          <Link to="/instructor/classrooms">Your classrooms</Link>
        </Button>
      </section>
    );
  if (classroom.isError || activity.isError || languages.isError)
    return (
      <section className="panel">
        <h1>Activity unavailable</h1>
        <p role="alert">Check classroom access and try again.</p>
        <Button
          onClick={() => {
            void classroom.refetch();
            void languages.refetch();
            if (activityId) void activity.refetch();
          }}
        >
          Try again
        </Button>
      </section>
    );
  if (!classroom.data || !languages.data || (activityId && !activity.data))
    return <p role="status">Loading authoring workspace...</p>;
  return (
    <>
      <Link className="back-link" to={`/instructor/classrooms/${classroomId}`}>
        Back to classroom
      </Link>
      <PageHeading
        eyebrow={classroom.data.data.section_label}
        title={
          activity.data ? activity.data.data.title : (searchParams.get("type") === "assignment" ? "Create assignment" : "Create activity")
        }
        description={searchParams.get("view") === "submissions" ? "Review submitted code, provide feedback and award points." : activityId ? "View the questions and update permitted settings." : "Set a title, questions and points, then publish to this section."}
      />
      {searchParams.get("view") === "submissions" && activityId ? <SubmissionHistory key={activityId} base={`/classrooms/${classroomId}/activities/${activityId}`} instructor /> : <ActivityForm
        key={`${classroomId}-${activityId}-${activity.data?.data.status}`}
        classroom={classroom.data.data}
        activity={activity.data?.data}
        languages={languages.data.data}
      />}
    </>
  );
}
