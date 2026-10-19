<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Classroom;
use App\Models\ClassroomMembership;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ClassroomWorkflow
{
    /** All domain mutations lock classroom first, then activity, then membership. */
    public function lock(string|int $id, bool $write = true): Classroom
    {
        $classroom = Classroom::whereKey($id)->lockForUpdate()->firstOrFail();
        Gate::authorize($write ? 'update' : 'view', $classroom);

        return $classroom;
    }

    public function audit(Request $request, Classroom $classroom, string $action, string $type = 'classroom', string|int|null $id = null, array $metadata = []): void
    {
        DB::table('audit_events')->insert(['actor_user_id' => $request->user()->id, 'classroom_id' => $classroom->id, 'action' => $action, 'subject_type' => $type, 'subject_id' => (string) ($id ?? $classroom->id), 'correlation_id' => $request->attributes->get('request_id'), 'safe_metadata' => json_encode($metadata, JSON_THROW_ON_ERROR), 'occurred_at' => now()]);
    }

    public function validate(Request $request, ?Classroom $classroom = null): array
    {
        $required = $classroom ? 'sometimes' : 'required';
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:150'], 'course_code' => ['sometimes', 'string', 'max:50'], 'section_label' => [$required, 'string', 'max:50'],
            'academic_year_start' => [$required, 'integer', 'between:2000,2100'], 'academic_year_end' => [$required, 'integer', 'between:2001,2101'],
            'year_level' => ['sometimes', 'in:First,Second,Third,Fourth'],
            'semester' => [$required, 'in:First,Second'], 'term_end_date' => ['sometimes', 'date_format:Y-m-d'],
            'timezone' => ['sometimes', 'timezone'], 'status' => ['sometimes', 'in:archived'],
            'instructor_id' => ['prohibited'], 'id' => ['prohibited'],
            'schedules' => ['sometimes', 'array', 'max:14'],
            'schedules.*' => ['array:class_session,day_of_week,starts_at,ends_at'],
            'schedules.*.class_session' => ['required', 'in:oc,lab'], 'schedules.*.day_of_week' => ['required', 'integer', 'between:1,7'],
            'schedules.*.starts_at' => ['required', 'date_format:H:i'], 'schedules.*.ends_at' => ['required', 'date_format:H:i'],
        ]);
        $start = (int) ($data['academic_year_start'] ?? $classroom?->academic_year_start);
        $end = (int) ($data['academic_year_end'] ?? $classroom?->academic_year_end);
        if (! $classroom) {
            $data += ['title' => $data['section_label'], 'course_code' => '', 'term_end_date' => $end.'-12-31', 'timezone' => 'Asia/Manila'];
        }
        $term = $data['term_end_date'] ?? $classroom?->term_end_date->format('Y-m-d');
        if ($end !== $start + 1 || $term < "$start-01-01" || $term > "$end-12-31") {
            throw ValidationException::withMessages(['academic_year_end' => 'Use consecutive academic years and a term end within those years.']);
        }
        $slots = $data['schedules'] ?? [];
        foreach ($slots as $index => $slot) {
            if ($slot['ends_at'] <= $slot['starts_at']) {
                throw ValidationException::withMessages(["schedules.$index.ends_at" => 'End time must follow start time on the same day.']);
            }
            foreach (array_slice($slots, 0, $index) as $other) {
                if ($slot['day_of_week'] == $other['day_of_week'] && $slot['starts_at'] < $other['ends_at'] && $slot['ends_at'] > $other['starts_at']) {
                    throw ValidationException::withMessages(['schedules' => 'Weekly slots in this classroom must not overlap.']);
                }
            }
        }
        if ($classroom && $classroom->activities()->whereNotNull('published_at')->exists()) {
            foreach (['academic_year_start', 'academic_year_end', 'semester', 'term_end_date', 'timezone'] as $field) {
                $original = $field === 'term_end_date' ? $classroom->term_end_date->format('Y-m-d') : $classroom->$field;
                abort_if(isset($data[$field]) && (string) $data[$field] !== (string) $original, 409, 'The academic term and timezone are fixed after publication.');
            }
        }

        return $data;
    }

    public function schedules(Classroom $classroom, array $slots): void
    {
        $classroom->schedules()->delete();
        $classroom->schedules()->createMany($slots);
    }

    public function allocate(ClassroomMembership $member, ?Activity $published = null): void
    {
        $activities = $published ? collect([$published]) : Activity::where('classroom_id', $member->classroom_id)->whereNotNull('published_at')->orderBy('id')->get();
        foreach ($activities as $activity) {
            $assigned = $published !== null || ($activity->status === 'published' && now()->lte($activity->deadline_at));
            DB::table('activity_allocations')->insertOrIgnore(['activity_id' => $activity->id, 'membership_id' => $member->id, 'status' => $assigned ? 'assigned' : 'not_assigned', 'reason' => $published ? 'published_to_member' : ($assigned ? 'open_on_join' : 'closed_on_join'), 'decided_at' => now()]);
        }
    }

    public function codeDigest(string $code): string
    {
        return hash_hmac('sha256', strtoupper(trim($code)), config('app.key'));
    }

    public function expiry(Request $request, Classroom $classroom): Carbon
    {
        $data = $request->validate(['expires_at' => ['required', 'date', 'regex:/(Z|[+-]\d{2}:\d{2})$/']]);
        $expiry = Carbon::parse($data['expires_at'])->utc();
        $term = Carbon::parse($classroom->term_end_date->format('Y-m-d'), $classroom->timezone)->endOfDay()->utc();
        if ($expiry->lte(now()) || $expiry->gt($term)) {
            throw ValidationException::withMessages(['expires_at' => 'Invitation expiry must be in the future and no later than the term end.']);
        }

        return $expiry;
    }
}
