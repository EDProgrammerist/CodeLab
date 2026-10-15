import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/ui/page-heading";
import { Pagination } from "@/components/ui/pagination";
import { ClassroomForm } from "@/components/features/classrooms/classroom-form";
import { readDomain, writeDomain } from "@/services/classroom-service";
import { useDomainAction } from "@/hooks/use-domain-action";
import type { Role } from "@/types/user";
import type { Classroom, PageData } from "@/types/classroom";
export function ClassroomSection({ role }: { role: Role }) {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const action = useDomainAction();
  const query = useQuery({
    queryKey: ["domain", "classrooms", page],
    queryFn: () => readDomain<PageData<Classroom>>(`/classrooms?page=${page}`),
  });
  return (
    <>
      <PageHeading
        eyebrow={
          role === "student" ? "Your learning space" : "Your teaching space"
        }
        title="Your classrooms"
        description="Each course, section and term has its own classroom."
        action={
          <Button
            onClick={() => setShowForm(!showForm)}
            aria-expanded={showForm}
          >
            {role === "student" ? "Join classroom" : "Create classroom"}
          </Button>
        }
      />
      {showForm &&
        (role === "instructor" ? (
          <ClassroomForm
            onSaved={() => {
              setShowForm(false);
              setPage(1);
            }}
          />
        ) : (
          <form
            className="panel mb-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void action.run(async () => {
                const response = await writeDomain<{
                  data: { classroom_id: string };
                }>("/classroom-joins", "post", {
                  invitation_code: data.get("invitation_code"),
                });
                navigate(`/student/classrooms/${response.data.classroom_id}`);
              });
            }}
          >
            <label className="field-label">
              Invitation code
              <Input
                name="invitation_code"
                required
                maxLength={64}
                autoComplete="off"
              />
            </label>
            <p className="muted text-sm">
              Ask your instructor for the current code.
            </p>
            <Button disabled={action.busy}>Join</Button>
          </form>
        ))}
      {action.error && <p role="alert">{action.error}</p>}
      {query.isPending && <p role="status">Loading classrooms...</p>}
      {query.isError && (
        <div className="panel">
          <p role="alert">Could not load your classrooms.</p>
          <Button onClick={() => void query.refetch()}>Try again</Button>
        </div>
      )}
      {query.data && (
        <>
          {query.data.data.length === 0 ? (
            <section className="panel">
              <h2>Nothing here yet</h2>
              <p className="muted mt-2">
                {role === "student"
                  ? "Join using an invitation code to see your assigned work."
                  : "Create your first classroom to plan activities and enroll students."}
              </p>
            </section>
          ) : (
            <div className="classroom-grid">
              {query.data.data.map((c) => (
                <article className="classroom-card panel" key={c.id}>
                  <p className="eyebrow">
                    {c.course_code} / {c.section_label}
                  </p>
                  <h2 className="mt-4 mb-3">
                    <Link
                      className="text-link"
                      to={`/${role}/classrooms/${c.id}`}
                    >
                      {c.title}
                    </Link>
                  </h2>
                  <p className="muted">
                    {c.academic_year_start}-{c.academic_year_end} / {c.semester}{" "}
                    semester
                  </p>
                  <p className="text-sm mt-3">
                    {c.status === "archived"
                      ? "Archived - history only"
                      : "Active classroom"}{" "}
                    / {c.timezone}
                  </p>
                </article>
              ))}
            </div>
          )}
          <Pagination
            page={page}
            lastPage={query.data.meta.last_page}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}
