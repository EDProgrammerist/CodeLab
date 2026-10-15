import { SubmissionHistory } from '@/components/features/editor/submission-history';
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeading } from "@/components/ui/page-heading";
import { readDomain, writeDomain } from "@/services/classroom-service";
import { useDomainAction } from "@/hooks/use-domain-action";
import type { Activity, TestCase } from "@/types/activity";
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
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [tests, setTests] = useState<TestCase[]>(
    activity?.tests ?? [
      {
        position: 1,
        visibility: "public",
        stdin: "",
        expected_stdout: "",
        explanation: "",
      },
      {
        position: 2,
        visibility: "hidden",
        stdin: "",
        expected_stdout: "",
        explanation: "",
      },
    ],
  );
  const published = !!activity?.published_at;
  const closed =
    activity?.status === "archived" || classroom.status === "archived";
  const testsLocked = closed || !!activity?.test_suite_locked_at;
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
  const updateTest = (index: number, values: Partial<TestCase>) => {
    setDirty(true);
    setTests(tests.map((t, i) => (i === index ? { ...t, ...values } : t)));
  };
  return (
    <>
      <form
        className="space-y-6"
        onChange={() => setDirty(true)}
        onSubmit={(e) => {
          e.preventDefault();
          const fields = Object.fromEntries(new FormData(e.currentTarget));
          void action.run(
            async () => {
              const payload = {
                ...fields,
                deadline_at: new Date(String(fields.deadline_at)).toISOString(),
                ...(!testsLocked && {
                  tests: tests.map((t, index) => ({
                    position: index + 1,
                    visibility: t.visibility,
                    stdin: t.stdin,
                    expected_stdout: t.expected_stdout,
                    explanation: t.explanation,
                  })),
                }),
              };
              const response = await writeDomain<{ data: Activity }>(
                endpoint,
                activity ? "patch" : "post",
                payload,
              );
              setDirty(false);
              if (!activity)
                navigate(
                  `/instructor/classrooms/${classroom.id}/activities/${response.data.id}`,
                  { replace: true },
                );
            },
            published
              ? "Published settings saved."
              : "Draft saved. Review it before publishing.",
          );
        }}
      >
        <section className="panel space-y-5">
          <h2>{published ? "Published brief" : "Activity details"}</h2>
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
              Instructions
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
                Activity type
                <select
                  name="activity_type"
                  className="select"
                  defaultValue={activity?.activity_type ?? "activity"}
                >
                  <option value="activity">Activity</option>
                  <option value="assignment">Assignment</option>
                </select>
              </label>
              <label className="field-label">
                Language
                <select
                  name="language_id"
                  className="select"
                  defaultValue={activity?.language_id ?? languages[0]?.id}
                >
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.display_name}
                    </option>
                  ))}
                </select>
              </label>

            </div>
          </fieldset>
          <p className="muted text-sm">
            Published instructions, categories and language are fixed.
            Examples lock when the first code submission is accepted.
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
              Attempt limit
              <Input
                name="submission_limit"
                type="number"
                required
                min={activity?.published_at ? activity.submission_limit : 1}
                max={50}
                defaultValue={activity?.submission_limit ?? 5}
              />
            </label>
          </fieldset>
          <p className="muted text-sm">
            Classroom timezone: {classroom.timezone}. Device time is converted
            to UTC when saved. No late submissions; after publication, deadlines
            and limits can only increase.
          </p>
        </section>
        <section className="panel space-y-5">
          <h2>Examples and instructor notes</h2>
          <p className="muted">
            Examples are optional and are not used for automated grading. Instructor-only examples stay private. Inputs and outputs preserve whitespace.
          </p>
          <fieldset disabled={testsLocked} className="space-y-5">
            <legend className="sr-only">Examples</legend>
            {tests.map((t, i) => (
              <fieldset key={i} className="test-editor space-y-3">
                <legend className="font-medium">Example {i + 1}</legend>
                <label className="field-label">
                  Visibility
                  <select
                    className="select"
                    value={t.visibility}
                    onChange={(e) =>
                      updateTest(i, {
                        visibility: e.target.value as TestCase["visibility"],
                      })
                    }
                  >
                    <option value="public">Public example</option>
                    <option value="hidden">Instructor-only example</option>
                  </select>
                </label>
                <div className="form-grid">
                  <label className="field-label">
                    Standard input
                    <Textarea
                      rows={3}
                      value={t.stdin}
                      onChange={(e) => updateTest(i, { stdin: e.target.value })}
                    />
                  </label>
                  <label className="field-label">
                    Expected output
                    <Textarea
                      rows={3}
                      value={t.expected_stdout}
                      onChange={(e) =>
                        updateTest(i, { expected_stdout: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="field-label">
                  Explanation
                  <Textarea
                    rows={2}
                    maxLength={5000}
                    value={t.explanation ?? ""}
                    onChange={(e) =>
                      updateTest(i, { explanation: e.target.value })
                    }
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTests(tests.filter((_, index) => index !== i));
                    setDirty(true);
                  }}
                >
                  Remove example {i + 1}
                </Button>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={tests.length >= 20}
              onClick={() => {
                setTests([
                  ...tests,
                  {
                    position: tests.length + 1,
                    visibility: "hidden",
                    stdin: "",
                    expected_stdout: "",
                    explanation: "",
                  },
                ]);
                setDirty(true);
              }}
            >
              Add example
            </Button>
          </fieldset>
          {testsLocked && (
            <p className="muted">These examples are read-only.</p>
          )}
        </section>
        {!closed && (
          <Button disabled={action.busy}>
            {action.busy
              ? "Saving..."
              : published
                ? "Save permitted changes"
                : "Save draft"}
          </Button>
        )}
      </form>
      {activity && !closed && (
        <section className="panel space-y-4 mt-6">
          <h2>Publication and lifecycle</h2>
          <p className="muted">
            {dirty
              ? "Save your changes before changing publication status."
              : "Publishing makes the saved activity visible to enrolled students."}
          </p>
          {!published && (
            <Button
              disabled={dirty || action.busy}
              onClick={() =>
                void action.run(async () => {
                  await writeDomain(endpoint, "patch", { status: "published" });
                }, "Activity published.")
              }
            >
              Publish saved draft
            </Button>
          )}
          <label className="flex gap-2 items-start">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
            />
            {published
              ? "I understand archiving permanently closes this activity."
              : "I confirm this draft can be permanently deleted."}
          </label>
          <Button
            variant="outline"
            disabled={!confirm || dirty || action.busy}
            onClick={() =>
              void action.run(
                async () => {
                  await writeDomain(
                    endpoint,
                    published ? "patch" : "delete",
                    published ? { status: "archived" } : undefined,
                  );
                  if (!published)
                    navigate(`/instructor/classrooms/${classroom.id}`);
                },
                published ? "Activity archived." : "Draft deleted.",
              )
            }
          >
            {published ? "Archive activity" : "Delete draft"}
          </Button>
        </section>
      )}
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
        eyebrow={`${classroom.data.data.course_code} / ${classroom.data.data.section_label}`}
        title={
          activity.data ? activity.data.data.title : "Create a coding challenge"
        }
        description="Save a draft, review the examples, then publish when ready."
      />
      <ActivityForm
        key={`${classroomId}-${activityId}-${activity.data?.data.status}`}
        classroom={classroom.data.data}
        activity={activity.data?.data}
        languages={languages.data.data}
      />
      {activityId && <SubmissionHistory key={activityId} base={`/classrooms/${classroomId}/activities/${activityId}`} instructor />}
    </>
  );
}
