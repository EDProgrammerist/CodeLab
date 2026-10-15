import { AssessmentWorkspace } from '@/components/features/editor/assessment-workspace';
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { readDomain } from "@/services/classroom-service";
import type { Activity } from "@/types/activity";
export function ActivityDetailSection() {
  const { classroomId, activityId } = useParams();
  const query = useQuery({
    queryKey: ["domain", "activity", classroomId, activityId],
    queryFn: () =>
      readDomain<{ data: Activity }>(
        `/classrooms/${classroomId}/activities/${activityId}`,
      ),
  });
  if (query.isPending) return <p role="status">Loading activity...</p>;
  if (query.isError)
    return (
      <section className="panel">
        <h1>Activity unavailable</h1>
        <p role="alert">
          It may be unpublished or your enrollment may have changed.
        </p>
        <Button onClick={() => void query.refetch()}>Try again</Button>
      </section>
    );
  const a = query.data.data;
  return (
    <>
      <Link className="back-link" to={`/student/classrooms/${classroomId}`}>
        Back to classroom
      </Link>
      <PageHeading
        eyebrow={`${a.grading_period.replace("_", "-")} / ${a.class_session.toUpperCase()} / ${a.activity_type}`}
        title={a.title}
        description={`${a.language.display_name} / ${a.submission_limit} submission attempts`}
      />
      <section className="panel space-y-4">
        <h2>Instructions</h2>
        <p className="whitespace-pre-wrap break-words">{a.instructions}</p>
        <p>
          Deadline:{" "}
          {new Date(a.deadline_at).toLocaleString(undefined, {
            timeZone: a.timezone,
          })}{" "}
          ({a.timezone})
        </p>
        <p>
          {a.allocation_status === "not_assigned"
            ? "Not assigned: this work closed before your enrollment. It does not count toward your progress."
            : "Assigned to you."}{" "}
          {a.status === "archived" ? "This activity is archived." : ""}
        </p>

      </section>
      <section className="panel space-y-5 mt-6">
        <h2>Public examples</h2>
        {a.public_examples?.map((t, i) => (
          <div key={i} className="space-y-2">
            <h3>Example {i + 1}</h3>
            <div className="form-grid">
              <div>
                <p className="text-sm muted">Input</p>
                <pre className="code-sample">{t.stdin || "(empty input)"}</pre>
              </div>
              <div>
                <p className="text-sm muted">Expected output</p>
                <pre className="code-sample">
                  {t.expected_stdout || "(empty output)"}
                </pre>
              </div>
            </div>
            {t.explanation && <p className="break-words">{t.explanation}</p>}
          </div>
        ))}
      </section>
      <AssessmentWorkspace key={a.id} activity={a} />
    </>
  );
}
