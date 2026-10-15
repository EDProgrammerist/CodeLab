import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { PageHeading } from '@/components/ui/page-heading';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { readDomain } from '@/services/classroom-service';
import type { Classroom, PageData } from '@/types/classroom';
import type { PeriodReport } from '@/types/assessment';
import type { Role } from '@/types/user';

function ClassroomReport({ classroomId, role }: { classroomId: string; role: Role }) {
 const [page, setPage] = useState(1);
 const [period, setPeriod] = useState('prelim'); const [session, setSession] = useState(''); const [kind, setKind] = useState('');
 const filters = new URLSearchParams({ grading_period: period, ...(session ? { class_session: session } : {}), ...(kind ? { activity_type: kind } : {}) }).toString();
 const path = `/classrooms/${classroomId}/results`;
 const query = useQuery({ queryKey: ['domain', 'report', classroomId, filters, page], queryFn: () => readDomain<{ data: PeriodReport }>(`${path}?${filters}&page=${page}`) });
 const report = query.data?.data;
 return <section className="space-y-5 mt-6">
  <div className="flex flex-wrap gap-4 items-end">
   <label>Grading period<select className="select block mt-2" value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }}>{[['prelim','Prelim'],['midterm','Midterm'],['semi_final','Semi-Final'],['final','Final']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
   <label>Session<select className="select block mt-2" value={session} onChange={e => { setSession(e.target.value); setPage(1); }}><option value="">All sessions</option><option value="oc">OC</option><option value="lab">LAB</option></select></label>
   <label>Work type<select className="select block mt-2" value={kind} onChange={e => { setKind(e.target.value); setPage(1); }}><option value="">All types</option><option value="activity">Activity</option><option value="assignment">Assignment</option></select></label>
   <Button variant="outline" onClick={() => void query.refetch()}>Refresh report</Button>
  </div>
  {query.isPending && <p role="status">Loading results...</p>}
  {query.isError && <p role="alert">Results unavailable. Check classroom access and refresh the report.</p>}
  {report && !query.isError && <>
   <p className="muted">Updated {new Date(report.generated_at).toLocaleString()} / classroom timezone: {report.classroom.timezone}</p>
   {report.activities.length === 0 ? <p className="panel">No published activities match these filters.</p> : report.rows.length === 0 ? <p className="panel">No enrolled students to report.</p> : <>
    {report.rows.map(row => <section key={row.membership_id} className="space-y-3">
     <h2>{role === 'student' ? 'Your progress' : row.name}</h2>
     {role === 'instructor' && <p className="muted">{row.email} / enrollment: {row.membership_status}</p>}
     <p className="muted">{row.cells.filter(c => c.state === 'completed').length} completed / {row.cells.filter(c => c.state === 'pending').length} pending / {row.cells.filter(c => c.state === 'missed').length} missed</p>
     <div className="table-scroll" role="region" tabIndex={0} aria-label={`Activity progress for ${row.name}`}><table><thead><tr><th>Activity</th><th>Status</th><th>Attempts used</th></tr></thead><tbody>{row.cells.map(cell => {
      const activity = report.activities.find(a => a.id === cell.activity_id)!;
      return <tr key={cell.activity_id}><th scope="row"><Link className="text-link" to={`/${role}/classrooms/${classroomId}/activities/${cell.activity_id}`}>{activity.title}</Link></th><td>{cell.state.replaceAll('_',' ')}{cell.closed ? ' / closed' : ''}</td><td>{cell.attempts_used}</td></tr>;
     })}</tbody></table></div>
    </section>)}
   </>}
   {report.meta && <Pagination page={page} lastPage={report.meta.last_page} onChange={setPage} />}
   <p className="muted">Completed means code has been submitted. Instructors review it and record scores separately in their class records.</p>
  </>}
 </section>;
}
export function ReportSection({ role }: { role: Role }) {
 const [page, setPage] = useState(1); const [selected, setSelected] = useState('');
 const query = useQuery({ queryKey: ['domain', 'report-classrooms', page], queryFn: () => readDomain<PageData<Classroom>>(`/classrooms?page=${page}`) });
 return <>
  <PageHeading eyebrow="Activity results" title={role === 'student' ? 'Your progress' : 'Submission tracking'} description="Track submitted, pending and missed work by grading period." />
  {query.isPending && <p role="status">Loading classrooms...</p>}
  {query.isError && <p role="alert">Could not load classrooms. <Button onClick={() => void query.refetch()}>Retry classrooms</Button></p>}
  {query.data && !query.isError && <>
   <label>Classroom<select className="select block mt-2 max-w-full" value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose a classroom</option>{query.data.data.map(c => <option key={c.id} value={c.id}>{c.course_code} / {c.section_label} / {c.title}{c.status === 'archived' ? ' (archived)' : ''}</option>)}</select></label>
   {query.data.data.length === 0 && <p className="panel mt-4">No classrooms available.</p>}
   <Pagination page={page} lastPage={query.data.meta.last_page} onChange={p => { setPage(p); setSelected(''); }} />
   {selected && <ClassroomReport key={selected} classroomId={selected} role={role} />}
  </>}
 </>;
}
