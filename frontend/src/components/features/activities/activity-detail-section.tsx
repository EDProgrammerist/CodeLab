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
        description={`${a.language.display_name} / ${a.max_points} points`}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <section className="panel space-y-4">
        <h2>Questions</h2>
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
      <div className="min-w-0"><AssessmentWorkspace key={a.id} activity={a} /></div>
      </div>
    </>
  );
}
