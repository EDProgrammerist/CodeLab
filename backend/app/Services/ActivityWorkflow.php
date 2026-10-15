<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Classroom;
use App\Models\Language;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ActivityWorkflow
{
    public function validate(Request $request, Classroom $classroom, ?Activity $activity = null): array
    {
        $required = $activity ? 'sometimes' : 'required';
        $data = $request->validate([
            'title' => [$required, 'string', 'max:150'], 'instructions' => [$required, 'string', 'max:20000'],
            'grading_period' => [$required, 'in:prelim,midterm,semi_final,final'], 'class_session' => [$required, 'in:oc,lab'], 'activity_type' => [$required, 'in:activity,assignment'],
            'language_id' => [$required, 'integer', Rule::exists('languages', 'id')->where('enabled', true)],
            'max_points' => ['prohibited'],
            'submission_limit' => [$required, 'integer', 'between:1,50'],
            'deadline_at' => [$required, 'date', 'regex:/(Z|[+-]\d{2}:\d{2})$/'],
            'status' => ['sometimes', 'in:published,archived'], 'classroom_id' => ['prohibited'], 'test_suite_locked_at' => ['prohibited'], 'assessment_digest' => ['prohibited'],
            'tests' => ['sometimes', 'array', 'max:20'],
            'tests.*' => ['array:position,visibility,stdin,expected_stdout,explanation'],
            ...$this->testRules('tests.*.'),
        ]);
        if (isset($data['deadline_at'])) {
            $data['deadline_at'] = Carbon::parse($data['deadline_at'])->utc();
            $term = Carbon::parse($classroom->term_end_date->format('Y-m-d'), $classroom->timezone)->endOfDay()->utc();
            if ($data['deadline_at']->gt($term)) {
                throw ValidationException::withMessages(['deadline_at' => 'Deadline must be on or before the classroom term end.']);
            }
        }
        if (isset($data['tests'])) {
            $data['tests'] = $this->normalizeTests($data['tests']);
        }

        return $data;
    }

    public function testRules(string $prefix = ''): array
    {
        $bytes = function (string $attribute, mixed $value, \Closure $fail): void {
            if (is_string($value) && strlen($value) > 65536) {
                $fail('Test input and output must each be at most 64 KiB.');
            }
        };

        return [$prefix.'position' => ['required', 'integer', 'between:1,20'], $prefix.'visibility' => ['required', 'in:public,hidden'],
            $prefix.'stdin' => ['present', 'nullable', 'string', $bytes], $prefix.'expected_stdout' => ['present', 'nullable', 'string', $bytes], $prefix.'explanation' => ['nullable', 'string', 'max:5000']];
    }

    public function normalizeTests(array $tests): array
    {
        if (count(array_unique(array_column($tests, 'position'))) !== count($tests)) {
            throw ValidationException::withMessages(['tests' => 'Test positions must be unique.']);
        }

        return array_map(fn ($test) => [...$test, 'stdin' => $test['stdin'] ?? '', 'expected_stdout' => $test['expected_stdout'] ?? '', 'explanation' => $test['explanation'] ?? null], $tests);
    }

    public function assertSuite(Activity $activity): void
    {
        $tests = $activity->tests()->get();
        if ($tests->count() > 20) {
            throw ValidationException::withMessages(['tests' => 'At most 20 examples are allowed.']);
        }
    }

    public function replaceTests(Activity $activity, array $tests): void
    {
        abort_if($activity->test_suite_locked_at, 409, 'Tests are locked after the first code submission. Create a replacement activity.');
        $activity->tests()->delete();
        $activity->tests()->createMany($tests);
        if ($activity->published_at) {
            $this->assertSuite($activity);
        }
    }

    public function digest(Activity $activity): void
    {
        $language = Language::findOrFail($activity->language_id);
        $payload = [$activity->only(['title', 'instructions', 'grading_period', 'class_session', 'activity_type', 'max_points', 'language_id']),
            $language->only(['slug', 'runtime_version', 'image_digest', 'judge_version']),
            $activity->tests()->get(['position', 'visibility', 'stdin', 'expected_stdout', 'explanation'])->toArray(),
            'manual-review;no-grading'];
        $activity->assessment_digest = hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
        $activity->save();
    }
}
