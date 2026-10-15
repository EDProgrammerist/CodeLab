import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useDomainAction } from '@/hooks/use-domain-action';
import { readDomain, writeDomain } from '@/services/classroom-service';
import type { Evaluation } from '@/types/assessment';
import type { PageData } from '@/types/classroom';

export function EvaluationResult({ result }: { result: Evaluation }) {
 return <div className="space-y-3">
  <p role="status">{result.state === 'not_received' ? 'Earlier submission was not received successfully.' : result.state === 'reviewed' ? 'Instructor feedback available.' : 'Code submitted for instructor review.'}</p>
  {result.feedback && <div className="inline-note"><div><h3>Instructor feedback</h3><p className="whitespace-pre-wrap break-words">{result.feedback.body}</p></div></div>}
 </div>;
}
function FeedbackForm({ base, record }: { base: string; record: Evaluation }) {
 const [body, setBody] = useState(record.feedback?.body ?? '');
 const action = useDomainAction();
 return <form className="space-y-3 mt-4" onSubmit={e => { e.preventDefault(); void action.run(async () => { await writeDomain(`${base}/submissions/${record.id}/feedback`, 'put', { body }); }, 'Feedback saved.'); }}>
  <label className="block">Comments and explanation<Textarea className="mt-2" rows={5} maxLength={5000} required value={body} onChange={e => setBody(e.target.value)} /></label>
  <Button disabled={action.busy} type="submit">{action.busy ? 'Saving...' : 'Save feedback'}</Button>
  {action.error && <p role="alert">{action.error}</p>}{action.message && <p role="status">{action.message}</p>}
 </form>;
}
function SubmissionDetail({ base, id, instructor }: { base: string; id: string; instructor: boolean }) {
 const query = useQuery({ queryKey: ['domain', 'submission', base, id], queryFn: () => readDomain<{ data: Evaluation }>(`${base}/submissions/${id}`) });
 if (query.isPending) return <p role="status">Loading submission...</p>;
 if (query.isError) return <div role="alert">Submission unavailable. <Button onClick={() => void query.refetch()}>Retry submission</Button></div>;
 return <section className="panel mt-4 space-y-4" aria-label="Selected submission">
  <h3>Submission #{query.data.data.attempt_number}</h3>
  <EvaluationResult result={query.data.data} />
  <details><summary>Submitted Main.java</summary><pre className="code-sample">{query.data.data.source_code}</pre></details>
  {instructor && <FeedbackForm key={id} base={base} record={query.data.data} />}
 </section>;
}
export function SubmissionHistory({ base, instructor = false }: { base: string; instructor?: boolean }) {
 const [page, setPage] = useState(1); const [selected, setSelected] = useState('');
 const query = useQuery({ queryKey: ['domain', 'submissions', base, page], queryFn: () => readDomain<PageData<Evaluation>>(`${base}/submissions?page=${page}`), refetchInterval: q => q.state.data?.data.some(r => ['queued', 'running'].includes(r.state)) ? 2000 : false });
 return <section className="mt-8 space-y-4"><h2>{instructor ? 'Student submissions and feedback' : 'Submission history'}</h2>
  {query.isPending && <p role="status">Loading history...</p>}
  {query.isError && <p role="alert">Could not load history. <Button onClick={() => void query.refetch()}>Retry history</Button></p>}
  {query.data && !query.isError && <>
   {query.data.data.length === 0 ? <p className="panel muted">No code submissions yet.</p> : <div className="table-scroll" role="region" tabIndex={0} aria-label="Submission history"><table><thead><tr>{instructor && <th>Student</th>}<th>Attempt</th><th>Accepted</th><th>Status</th><th>Review</th></tr></thead><tbody>{query.data.data.map(r => <tr key={r.id}>{instructor && <td>{r.student_name}</td>}<td>{r.attempt_number}</td><td>{new Date(r.accepted_at).toLocaleString()}</td><td>{r.state.replaceAll('_', ' ')}</td><td><Button variant="outline" onClick={() => setSelected(r.id)}>View submission {r.attempt_number}</Button></td></tr>)}</tbody></table></div>}
   <Pagination page={page} lastPage={query.data.meta.last_page} onChange={setPage} />
  </>}
  {selected && <SubmissionDetail key={selected} base={base} id={selected} instructor={instructor} />}
 </section>;
}
