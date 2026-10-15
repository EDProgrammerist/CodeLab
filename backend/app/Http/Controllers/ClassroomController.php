<?php

namespace App\Http\Controllers;

use App\Http\Resources\ClassroomResource;
use App\Models\Classroom;
use App\Services\ClassroomWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ClassroomController extends Controller
{
    public function __construct(private ClassroomWorkflow $workflow) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Classroom::with('schedules');
        if ($request->user()->role === 'instructor') {
            $query->where('instructor_id', $request->user()->id);
        } else {
            $query->whereHas('memberships', fn ($q) => $q->where('student_id', $request->user()->id)->where('status', 'active'));
        }

        return ClassroomResource::collection($query->orderByDesc('id')->paginate(25));
    }

    public function show(Classroom $classroom): ClassroomResource
    {
        Gate::authorize('view', $classroom);

        return new ClassroomResource($classroom);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('instructor-dashboard');
        $data = $this->workflow->validate($request);
        abort_if(isset($data['status']), 422, 'New classrooms must be active.');
        $classroom = DB::transaction(function () use ($request, $data) {
            $classroom = new Classroom($data);
            $classroom->instructor_id = $request->user()->id;
            $classroom->save();
            $classroom->refresh();
            $this->workflow->schedules($classroom, $data['schedules'] ?? []);
            $this->workflow->audit($request, $classroom, 'classroom.created');

            return $classroom;
        });

        return (new ClassroomResource($classroom))->response()->setStatusCode(201);
    }

    public function update(Request $request, Classroom $classroom): ClassroomResource
    {
        return DB::transaction(function () use ($request, $classroom) {
            $classroom = $this->workflow->lock($classroom->id);
            $data = $this->workflow->validate($request, $classroom);
            $classroom->fill($data);
            if (isset($data['status'])) {
                $classroom->status = 'archived';
                $classroom->archived_at = now();
                DB::table('classroom_invitations')->where('classroom_id', $classroom->id)->update(['revoked_at' => now()]);
            }
            $classroom->save();
            if (isset($data['schedules'])) {
                $this->workflow->schedules($classroom, $data['schedules']);
            }
            $this->workflow->audit($request, $classroom, 'classroom.updated', metadata: ['fields' => array_keys($data)]);

            return new ClassroomResource($classroom);
        });
    }

    public function invitation(Request $request, Classroom $classroom): JsonResponse
    {
        Gate::authorize('view', $classroom);
        Gate::authorize('instructor-dashboard');
        $invitation = DB::table('classroom_invitations')->where('classroom_id', $classroom->id)->first(['expires_at', 'revoked_at']);

        return response()->json(['data' => $invitation ? ['expires_at' => Carbon::parse($invitation->expires_at)->toISOString(), 'revoked_at' => $invitation->revoked_at ? Carbon::parse($invitation->revoked_at)->toISOString() : null] : null]);
    }

    public function rotate(Request $request, Classroom $classroom): JsonResponse
    {
        return DB::transaction(function () use ($request, $classroom) {
            $classroom = $this->workflow->lock($classroom->id);
            $expiry = $this->workflow->expiry($request, $classroom);
            $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            $code = '';
            for ($index = 0; $index < 12; $index++) {
                $code .= $alphabet[random_int(0, 31)];
            }
            DB::table('classroom_invitations')->updateOrInsert(['classroom_id' => $classroom->id], ['code_digest' => $this->workflow->codeDigest($code), 'expires_at' => $expiry, 'revoked_at' => null, 'created_at' => now(), 'updated_at' => now()]);
            $this->workflow->audit($request, $classroom, 'invitation.rotated');

            return response()->json(['data' => ['invitation_code' => $code, 'expires_at' => $expiry->toISOString()]]);
        });
    }

    public function revoke(Request $request, Classroom $classroom): Response
    {
        DB::transaction(function () use ($request, $classroom) {
            $classroom = $this->workflow->lock($classroom->id);
            DB::table('classroom_invitations')->where('classroom_id', $classroom->id)->update(['revoked_at' => now(), 'updated_at' => now()]);
            $this->workflow->audit($request, $classroom, 'invitation.revoked');
        });

        return response()->noContent();
    }

    public function join(Request $request): JsonResponse
    {
        Gate::authorize('student-dashboard');
        $data = $request->validate(['invitation_code' => ['required', 'string', 'max:64']]);
        $digest = $this->workflow->codeDigest($data['invitation_code']);
        $invitation = DB::table('classroom_invitations')->where('code_digest', $digest)->first();
        abort_unless($invitation, 422, 'Invitation is invalid or unavailable.');

        return DB::transaction(function () use ($request, $invitation, $digest) {
            $classroom = Classroom::whereKey($invitation->classroom_id)->lockForUpdate()->firstOrFail();
            $valid = DB::table('classroom_invitations')->where('classroom_id', $classroom->id)->where('code_digest', $digest)->whereNull('revoked_at')->where('expires_at', '>', now())->exists();
            abort_unless($valid && $classroom->status === 'active', 422, 'Invitation is invalid or unavailable.');
            $member = $classroom->memberships()->where('student_id', $request->user()->id)->lockForUpdate()->first();
            abort_if($member && $member->status === 'removed', 409, 'Ask your instructor to reactivate your enrollment.');
            $created = ! $member;
            if (! $member) {
                $member = $classroom->memberships()->create(['student_id' => $request->user()->id, 'status' => 'active', 'joined_at' => now()]);
                $this->workflow->allocate($member);
                $this->workflow->audit($request, $classroom, 'membership.joined', 'membership', $member->id);
            }

            return response()->json(['data' => ['id' => (string) $member->id, 'classroom_id' => (string) $classroom->id, 'status' => $member->status]], $created ? 201 : 200);
        });
    }

    public function members(Request $request, Classroom $classroom): JsonResponse
    {
        Gate::authorize('view', $classroom);
        Gate::authorize('instructor-dashboard');
        $data = $request->validate(['status' => ['sometimes', 'in:active,removed']]);
        $members = $classroom->memberships()->with('student')->when(isset($data['status']), fn ($q) => $q->where('status', $data['status']))->orderBy('id')->paginate(25);

        return response()->json(['data' => $members->map(fn ($m) => ['id' => (string) $m->id, 'name' => $m->student->name, 'email' => $m->student->email, 'student_number' => $m->student->student_number, 'status' => $m->status, 'joined_at' => $m->joined_at->toISOString()]), 'meta' => ['current_page' => $members->currentPage(), 'last_page' => $members->lastPage(), 'total' => $members->total()]]);
    }

    public function updateMember(Request $request, Classroom $classroom, string $membership): JsonResponse
    {
        return DB::transaction(function () use ($request, $classroom, $membership) {
            $classroom = $this->workflow->lock($classroom->id);
            $data = $request->validate(['status' => ['required', 'in:active,removed'], 'student_id' => ['prohibited'], 'classroom_id' => ['prohibited']]);
            $member = $classroom->memberships()->whereKey($membership)->lockForUpdate()->firstOrFail();
            if ($member->status !== $data['status']) {
                $member->status = $data['status'];
                $member->removed_at = $data['status'] === 'removed' ? now() : null;
                $member->save();
                if ($member->status === 'active') {
                    $this->workflow->allocate($member);
                }
                $this->workflow->audit($request, $classroom, 'membership.'.$data['status'], 'membership', $member->id);
            }

            return response()->json(['data' => ['id' => (string) $member->id, 'status' => $member->status]]);
        });
    }
}
