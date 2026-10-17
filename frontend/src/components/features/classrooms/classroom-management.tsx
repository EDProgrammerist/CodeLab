import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useDomainAction } from "@/hooks/use-domain-action";
import { readDomain, writeDomain } from "@/services/classroom-service";
import type { Classroom, Membership, PageData } from "@/types/classroom";
export function ClassroomManagement({ classroom }: { classroom: Classroom }) {
  const [page, setPage] = useState(1)
  const [defaultExpiry] = useState(() => new Date(Date.now() + 7 * 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16));
  const [code, setCode] = useState("");
  const action = useDomainAction();
  const path = `/classrooms/${classroom.id}`;
  const roster = useQuery({
    queryKey: ["domain", "roster", classroom.id, page],
    queryFn: () =>
      readDomain<PageData<Membership>>(`${path}/memberships?page=${page}`),
  });
  const invitation = useQuery({
    queryKey: ["domain", "invitation", classroom.id],
    queryFn: () =>
      readDomain<{
        data: { expires_at: string; revoked_at: string | null } | null;
      }>(`${path}/invitation`),
  });
  const active = classroom.status === "active";
  return (
    <section className="space-y-6 my-6" aria-label="Classroom enrollment">
      <div className="panel space-y-4">
        <h2>Enrollment invitation</h2>
        {invitation.isError && (
          <p role="alert">Could not load invitation status.</p>
        )}
        {invitation.data && (
          <p className="muted">
            {invitation.data.data
              ? `Expires: ${invitation.data.data.expires_at} UTC${invitation.data.data.revoked_at ? " (revoked)" : ""}`
              : "No invitation issued yet."}
          </p>
        )}
        {active && (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const value = String(
                new FormData(e.currentTarget).get("expires_at"),
              );
              void action.run(async () => {
                const result = await writeDomain<{
                  data: { invitation_code: string };
                }>(`${path}/invitation`, "put", {
                  expires_at: new Date(value).toISOString(),
                });
                setCode(result.data.invitation_code);
              }, "New code created. The previous code no longer works.");
            }}
          >
            <label className="field-label">
              Invitation expiry (your device time)
              <Input
                name="expires_at"
                type="datetime-local"
                required
                defaultValue={defaultExpiry}
              />
            </label>
            <Button disabled={action.busy}>Generate new code</Button>
            <Button
              type="button"
              variant="outline"
              disabled={action.busy || !invitation.data?.data}
              onClick={() =>
                void action.run(async () => {
                  await writeDomain(`${path}/invitation`, "delete");
                  setCode("");
                }, "Invitation revoked.")
              }
            >
              Revoke code
            </Button>
          </form>
        )}
        <p className="text-sm muted">
          Codes must expire before term end. Copy a newly generated code now; it
          is shown only once.
        </p>
        {code && (
          <div>
            <label className="field-label">
              New invitation code
              <Input readOnly value={code} onFocus={(e) => e.target.select()} />
            </label>
            <Button
              className="mt-2"
              variant="outline"
              onClick={() => setCode("")}
            >
              Hide code
            </Button>
          </div>
        )}
      </div>
      <div className="panel space-y-4">
        <h2>Enrolled students</h2>
        {roster.isPending && <p role="status">Loading roster...</p>}
        {roster.isError && <p role="alert">Could not load roster.</p>}
        {roster.data && (
          <>
            {!roster.data.data.length && (
              <p className="muted">
                No students yet. Share an invitation code to begin.
              </p>
            )}
            {roster.data.data.map((m) => (
              <div className="roster-row" key={m.id}>
                <div>
                  <h3>{m.name}</h3>
                  <p className="muted break-words">{m.email}</p>
                  <p className="text-sm">
                    {m.student_number ?? "No student number"} / {m.status}
                  </p>
                </div>
                {active && (
                  <Button
                    variant="outline"
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(
                        async () => {
                          await writeDomain(
                            `${path}/memberships/${m.id}`,
                            "patch",
                            {
                              status:
                                m.status === "active" ? "removed" : "active",
                            },
                          );
                        },
                        m.status === "active"
                          ? "Enrollment removed. History is preserved."
                          : "Enrollment reactivated.",
                      )
                    }
                  >
                    {m.status === "active" ? "Remove enrollment" : "Reactivate"}
                  </Button>
                )}
              </div>
            ))}
            <Pagination
              page={page}
              lastPage={roster.data.meta.last_page}
              onChange={setPage}
            />
          </>
        )}
      </div>
      {action.error && <p role="alert">{action.error}</p>}
      {action.message && <p role="status">{action.message}</p>}
    </section>
  );
}
