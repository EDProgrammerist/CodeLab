import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { writeDomain } from "@/services/classroom-service";
import { useDomainAction } from "@/hooks/use-domain-action";
import type { Classroom } from "@/types/classroom";
export function ClassroomForm({
  classroom,
  onSaved,
}: {
  classroom?: Classroom;
  onSaved: () => void;
}) {
  const action = useDomainAction();
  const year = new Date().getFullYear();
  return (
    <form
      className="panel space-y-5 mb-6"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        void action.run(async () => {
          await writeDomain(
            classroom ? `/classrooms/${classroom.id}` : "/classrooms",
            classroom ? "patch" : "post",
            data,
          );
          onSaved();
        });
      }}
    >
      <h2>{classroom ? "Classroom settings" : "New classroom"}</h2>
      <div className="form-grid">
        <label className="field-label">
          Year level
          <select name="year_level" className="select" required defaultValue={classroom?.year_level ?? ''}>
            <option value="" disabled>Select year level</option>
            {['First', 'Second', 'Third', 'Fourth'].map(level => <option key={level} value={level}>{level} Year</option>)}
          </select>
        </label>
        <label className="field-label">
          Section
          <Input
            name="section_label"
            required
            maxLength={50}
            defaultValue={classroom?.section_label}
          />
        </label>
        <label className="field-label">
          Academic year start
          <Input
            name="academic_year_start"
            type="number"
            min={2000}
            max={2100}
            required
            defaultValue={classroom?.academic_year_start ?? year}
          />
        </label>
        <label className="field-label">
          Academic year end
          <Input
            name="academic_year_end"
            type="number"
            min={2001}
            max={2101}
            required
            defaultValue={classroom?.academic_year_end ?? year + 1}
          />
        </label>
        <label className="field-label">
          Semester
          <select
            className="select"
            name="semester"
            defaultValue={classroom?.semester ?? "First"}
          >
            <option>First</option>
            <option>Second</option>
          </select>
        </label>
      </div>
      <p className="muted text-sm">
        Create a classroom for your year level, section, semester and academic year.
      </p>
      {action.error && <p role="alert">{action.error}</p>}
      <Button disabled={action.busy}>
        {action.busy ? "Saving..." : "Save classroom"}
      </Button>
    </form>
  );
}
