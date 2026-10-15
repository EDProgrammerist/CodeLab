import { Textarea } from '@/components/ui/textarea';
import { lazy, Suspense, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EvaluationResult, SubmissionHistory } from './submission-history';
import { sendEvaluation } from '@/services/assessment-service';
import { authError } from '@/services/auth-service';
import type { Activity } from '@/types/activity';
import type { Evaluation } from '@/types/assessment';
const JavaEditor = lazy(() => import('./java-editor').then(m => ({ default: m.JavaEditor })));
export function AssessmentWorkspace({ activity }: { activity: Activity }) {
 const base = `/classrooms/${activity.classroom_id}/activities/${activity.id}`;
 const client = useQueryClient();
 const [code, setCode] = useState('public class Main {\n    public static void main(String[] args) {\n        // Write your solution here.\n    }\n}\n');
 const [plain, setPlain] = useState(false);
 const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const [result, setResult] = useState<Evaluation | null>(null);
 const request = useRef<{ fingerprint: string; key: string } | null>(null);
 const pending = useRef(false);
 async function send() {
  if (pending.current) return;
  pending.current = true; setBusy(true); setError('');
  const data = { source_code: code, language_id: activity.language_id };
  const fingerprint = JSON.stringify(data);
  if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() };
  try {
   const record = await sendEvaluation(`${base}/submissions`, data, request.current.key);
   setResult(record); request.current = null;
   await client.invalidateQueries({ queryKey: ['domain'] });
  } catch (err) { setError(authError(err)); } finally { pending.current = false; setBusy(false); }
 }
 return <>
  <section className="panel mt-6 space-y-4"><h2>Code workspace</h2>
   <p>Single Main.java file, class Main, standard input and output. No packages or external libraries.</p>
   <p className="muted">Your draft stays in this page only. Copy it before leaving or reloading.</p>
   {!activity.execution_available && <p role="status" className="inline-note">Run Java is deferred. You can submit code now for instructor review; no automatic grading or scores are provided.</p>}
   <label className="flex items-center gap-2"><input type="checkbox" checked={plain} onChange={e => setPlain(e.target.checked)} />Use plain text editor</label>
   {plain ? <label className="block">Java source code<Textarea className="mt-2 h-[380px] font-mono [field-sizing:fixed]" rows={16} value={code} onChange={e => setCode(e.target.value)} /></label> : <Suspense fallback={<p role="status">Loading editor...</p>}><JavaEditor value={code} onChange={setCode} readOnly={false} /></Suspense>}
   <p>{activity.attempts_used ?? 0} of {activity.submission_limit} submission attempts used. Each accepted submission is saved for review.</p>
   {activity.submission_unavailable_reason && <p>{activity.submission_unavailable_reason}</p>}
   <div className="flex flex-wrap gap-3"><Button variant="outline" disabled>Run Java (coming later)</Button><Button disabled={!activity.can_submit || busy} onClick={() => void send()}>{busy ? 'Submitting...' : 'Submit code'}</Button></div>
   {error && <p role="alert">{error} Retry unchanged code to reuse the same request safely.</p>}
   {result && <EvaluationResult result={result} />}
  </section>
  <SubmissionHistory base={base} />
 </>;
}
