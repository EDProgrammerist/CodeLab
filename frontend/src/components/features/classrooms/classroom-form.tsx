import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { writeDomain } from "@/services/classroom-service";
import { useDomainAction } from "@/hooks/use-domain-action";
import type { Classroom, Schedule } from "@/types/classroom";
export function ClassroomForm({
  classroom,
  onSaved,
}: {
  classroom?: Classroom;
  onSaved: () => void;
}) {
  const action = useDomainAction();
  const [slots, setSlots] = useState<Schedule[]>(
    classroom?.schedules.map((s) => ({
      ...s,
      starts_at: s.starts_at.slice(0, 5),
      ends_at: s.ends_at.slice(0, 5),
    })) ?? [],
  );
  const year = new Date().getFullYear();
  const setSlot = (index: number, values: Partial<Schedule>) =>
    setSlots(
      slots.map((slot, i) => (i === index ? { ...slot, ...values } : slot)),
    );
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
            { ...data, schedules: slots },
          );
          onSaved();
        });
      }}
    >
      <h2>{classroom ? "Classroom settings" : "New classroom"}</h2>
      <div className="form-grid">
        <label className="field-label">
          Classroom title
          <Input
            name="title"
            required
            maxLength={150}
            defaultValue={classroom?.title}
          />
        </label>
        <label className="field-label">
          Course code
          <Input
            name="course_code"
            required
            maxLength={50}
            defaultValue={classroom?.course_code}
          />
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
            <option>Summer</option>
          </select>
        </label>
        <label className="field-label">
          Term end date
          <Input
            name="term_end_date"
            type="date"
            required
            defaultValue={classroom?.term_end_date}
          />
        </label>
        <label className="field-label">
          Classroom timezone
          <Input
            name="timezone"
            required
            defaultValue={classroom?.timezone ?? "Asia/Manila"}
          />
        </label>
      </div>
      <p className="muted text-sm">
        One classroom per course, section and term. Term and timezone are fixed
        after the first publication.
      </p>
      <fieldset className="space-y-4">
        <legend className="font-medium mb-3">Weekly OC and LAB schedule</legend>
        <p className="muted text-sm">
          Times use the classroom timezone. Slots must finish on the same day
          and cannot overlap.
        </p>
        {slots.map((slot, i) => (
          <fieldset className="schedule-row" key={i}>
            <legend className="sr-only">Slot {i + 1}</legend>
            <label className="field-label">
              Session
              <select
                className="select"
                value={slot.class_session}
                onChange={(e) =>
                  setSlot(i, {
                    class_session: e.target.value as Schedule["class_session"],
                  })
                }
              >
                <option value="oc">OC</option>
                <option value="lab">LAB</option>
              </select>
            </label>
            <label className="field-label">
              Day
              <select
                className="select"
                value={slot.day_of_week}
                onChange={(e) =>
                  setSlot(i, { day_of_week: Number(e.target.value) })
                }
              >
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day, index) => (
                  <option key={day} value={index + 1}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Start
              <Input
                type="time"
                required
                value={slot.starts_at}
                onChange={(e) => setSlot(i, { starts_at: e.target.value })}
              />
            </label>
            <label className="field-label">
              End
              <Input
                type="time"
                required
                value={slot.ends_at}
                onChange={(e) => setSlot(i, { ends_at: e.target.value })}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              aria-label={`Remove slot ${i + 1}`}
              onClick={() => setSlots(slots.filter((_, index) => index !== i))}
            >
              Remove
            </Button>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={slots.length >= 14}
          onClick={() =>
            setSlots([
              ...slots,
              {
                class_session: "lab",
                day_of_week: 1,
                starts_at: "09:00",
                ends_at: "10:00",
              },
            ])
          }
        >
          Add weekly slot
        </Button>
      </fieldset>
      {action.error && <p role="alert">{action.error}</p>}
      <Button disabled={action.busy}>
        {action.busy ? "Saving..." : "Save classroom"}
      </Button>
    </form>
  );
}
